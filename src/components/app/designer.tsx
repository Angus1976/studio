

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScenarioCard } from '@/components/app/scenario-card';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, UploadCloud, Library, Bot, LoaderCircle, Wand2, Trash2, TestTube2, Pencil } from 'lucide-react';
import { digitalEmployee } from '@/ai/flows/digital-employee';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';

export type Scenario = {
    id: string;
    title: string;
    description: string;
    industry: string;
    task: string;
    prompt: string;
};

const emptyScenario: Omit<Scenario, 'id'> = { title: '', description: '', industry: '', task: '', prompt: '' };

export function Designer() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [editingScenario, setEditingScenario] = useState<Partial<Scenario>>(emptyScenario);
  const [testContext, setTestContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [testResult, setTestResult] = useState('');
  const [testPromptId, setTestPromptId] = useState('');
  const { toast } = useToast();
  
  useEffect(() => {
    const q = query(collection(db, "scenarios"), orderBy("title"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scenariosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scenario));
      setScenarios(scenariosData);
      setIsLibraryLoading(false);
    }, (error) => {
      console.error("Error fetching scenarios:", error);
      toast({ variant: "destructive", title: "获取场景库失败" });
      setIsLibraryLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);


  const handleInputChange = (field: keyof Omit<Scenario, 'id'>, value: string) => {
    setEditingScenario(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddOrUpdateScenario = async () => {
    if (!editingScenario.title || !editingScenario.prompt) {
         toast({
            variant: 'destructive',
            title: '缺少信息',
            description: '请填写能力标题和核心提示词。',
        });
        return;
    }

    setIsLoading(true);
    try {
      if (editingScenario.id) {
        // Update
        const scenarioRef = doc(db, "scenarios", editingScenario.id);
        const { id, ...dataToUpdate } = editingScenario;
        await updateDoc(scenarioRef, dataToUpdate);
        toast({ title: '场景已更新', description: `“${editingScenario.title}”已成功更新。` });
      } else {
        // Add
        await addDoc(collection(db, "scenarios"), editingScenario);
        toast({ title: '场景已添加', description: `“${editingScenario.title}”已添加到场景库。` });
      }
      setEditingScenario(emptyScenario);
    } catch (error) {
      console.error("Error saving scenario:", error);
      toast({ variant: 'destructive', title: '保存失败', description: '保存场景时发生错误。' });
    } finally {
      setIsLoading(false);
    }
  }

  const handleTestPrompt = async () => {
    const usePromptId = !!testPromptId.trim();
    const useNewPrompt = !usePromptId && !!editingScenario.prompt?.trim();

    if (!usePromptId && !useNewPrompt) {
        toast({
            variant: 'destructive',
            title: '缺少提示词',
            description: '请填写新的核心提示词，或提供一个已有的提示ID进行测试。',
        });
        return;
    }

    if (!testContext) {
        toast({
            variant: 'destructive',
            title: '缺少测试内容',
            description: '请输入需要AI处理的具体内容来测试效果。',
        });
        return;
    }


    setIsLoading(true);
    setTestResult('');
    
    try {
        const promptIdForCall = usePromptId ? testPromptId : `new-prompt-${Date.now()}`;
        const promptContentForCall = useNewPrompt ? editingScenario.prompt : undefined;
        
        if (usePromptId) {
            toast({
                title: "正在测试已有提示...",
                description: `正在调用提示 ID: "${testPromptId}"。`,
            });
        } else {
             toast({
                title: "正在测试新提示...",
                description: `能力 "${editingScenario.title || '新能力'}" 正在被测试。`,
            });
        }

        const result = await digitalEmployee({
            promptId: promptIdForCall,
            promptContent: promptContentForCall,
            userContext: testContext,
        });

        setTestResult(result.response);

    } catch (error) {
      console.error("Error testing digital employee flow:", error);
      toast({
        variant: "destructive",
        title: "测试失败",
        description: "调用 AI 流程时发生错误。",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditScenario = (scenario: Scenario) => {
    setEditingScenario(scenario);
    toast({
      title: '正在编辑',
      description: `已将“${scenario.title}”加载到设计器中。`
    })
  };

  const handleDeleteScenario = async (scenario: Scenario) => {
    try {
        await deleteDoc(doc(db, "scenarios", scenario.id));
        toast({
          variant: 'destructive',
          title: '场景已删除',
          description: `“${scenario.title}”已从库中移除。`
        })
    } catch (error) {
        console.error("Error deleting scenario:", error);
        toast({
          variant: 'destructive',
          title: '删除失败',
          description: '删除场景时发生错误。'
        })
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Left Column: Library */}
      <div className="lg:col-span-7 h-full">
        <Card className="h-full flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Library className="h-6 w-6 text-accent"/>
                能力场景库
            </CardTitle>
            <CardDescription>
                浏览、搜索和管理已发布的 AI 数字员工能力场景。点击卡片上的编辑按钮可加载至右侧设计器。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
               {isLibraryLoading ? (
                 <div className="flex items-center justify-center h-full"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
               ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
                    {scenarios.map(scenario => (
                        <ScenarioCard 
                          key={scenario.id} 
                          scenario={scenario} 
                          onEdit={() => handleEditScenario(scenario)}
                          onDelete={() => handleDeleteScenario(scenario)}
                        />
                    ))}
                </div>
               )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Designer */}
      <div className="lg:col-span-5 h-full">
         <Card className="h-full flex flex-col shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Bot className="h-6 w-6 text-accent"/>
                    数字员工设计器
                </CardTitle>
                <CardDescription>
                    在这里创建、配置和测试新的 AI 数字员工能力场景。
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-4 overflow-y-auto">
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-4 pr-4">
                        <h3 className="text-lg font-semibold text-foreground">{editingScenario.id ? "编辑场景" : "创建新场景"}</h3>
                        <div>
                            <Label htmlFor="scenario-title">能力标题</Label>
                            <Input id="scenario-title" placeholder="例如：智能招聘助理" value={editingScenario.title || ''} onChange={e => handleInputChange('title', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="scenario-desc">能力描述</Label>
                            <Textarea id="scenario-desc" placeholder="简要描述此能力解决了什么问题..." value={editingScenario.description || ''} onChange={e => handleInputChange('description', e.target.value)}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="scenario-industry">适用行业</Label>
                                <Input id="scenario-industry" placeholder="例如：人力资源" value={editingScenario.industry || ''} onChange={e => handleInputChange('industry', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="scenario-task">核心任务</Label>
                                <Select value={editingScenario.task || ''} onValueChange={(value) => handleInputChange('task', value)}>
                                  <SelectTrigger id="scenario-task">
                                    <SelectValue placeholder="选择任务类型" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="招聘">招聘</SelectItem>
                                    <SelectItem value="内容创作">内容创作</SelectItem>
                                    <SelectItem value="代码审查">代码审查</SelectItem>
                                    <SelectItem value="合同审查">合同审查</SelectItem>
                                    <SelectItem value="客户支持">客户支持</SelectItem>
                                    <SelectItem value="数据分析">数据分析</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <Button className="w-full" onClick={handleAddOrUpdateScenario} disabled={isLoading}>
                            {isLoading ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                            {editingScenario.id ? '更新至场景库' : '添加至场景库'}
                        </Button>
                        
                        <Separator className="my-6" />

                        <h3 className="text-lg font-semibold text-foreground">提示词测试</h3>
                        <div>
                            <Label htmlFor="scenario-prompt">核心提示词 (Prompt)</Label>
                            <Textarea id="scenario-prompt" placeholder="在此创建新的中英文提示词，或留空以使用下面的ID..." rows={5} value={editingScenario.prompt || ''} onChange={e => handleInputChange('prompt', e.target.value)} />
                        </div>
                        
                        <div className='flex items-center gap-2'>
                            <Separator className='flex-1' />
                            <span className='text-xs text-muted-foreground'>或</span>
                            <Separator className='flex-1' />
                        </div>
                        
                        <div>
                            <Label htmlFor="prompt-id">调用已有提示词ID进行测试</Label>
                            <Input id="prompt-id" placeholder="例如: recruitment-expert" value={testPromptId} onChange={e => setTestPromptId(e.target.value)} />
                        </div>

                        <Separator />

                        <div>
                            <Label htmlFor="scenario-test">测试内容</Label>
                            <Textarea id="scenario-test" placeholder="输入需要AI处理的具体内容来测试提示词效果..." value={testContext} onChange={e => setTestContext(e.target.value)} />
                        </div>
                        
                        {isLoading && !testResult && (
                            <div className="flex items-center justify-center gap-2 text-primary">
                                <LoaderCircle className="animate-spin h-5 w-5" />
                                <span>正在调用AI进行测试...</span>
                            </div>
                        )}
                        {testResult && (
                            <Card className="bg-secondary/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Wand2 className="h-5 w-5 text-accent" />
                                        测试输出
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-sm">
                                    <p className="whitespace-pre-wrap">{testResult}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </ScrollArea>


                <div className="mt-auto pt-4 border-t">
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleTestPrompt} disabled={isLoading}>
                        {isLoading ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <TestTube2 className="mr-2 h-5 w-5" />}
                        测试提示词
                    </Button>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

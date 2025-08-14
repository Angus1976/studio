
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Wand2, ArrowRight, Network, PlusCircle, Pencil, Trash2, Import } from 'lucide-react';
import { analyzeOrgStructure, AnalyzeOrgStructureOutput } from '@/ai/flows/analyze-org-structure';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


type OrgNodeData = {
    id: string;
    name: string;
    parentId: string | null;
};

// Initial state with a root node
const initialOrgData: OrgNodeData[] = [
    { id: 'root', name: '公司', parentId: null },
];

function OrgChartNode({ node, allNodes, onEdit, onDelete }: { node: OrgNodeData; allNodes: OrgNodeData[], onEdit: (node: OrgNodeData) => void; onDelete: (nodeId: string) => void; }) {
    const children = allNodes.filter(n => n.parentId === node.id);

    return (
        <div className="ml-6 pl-4 border-l border-border relative">
             <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
                <Network className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="font-medium text-sm flex-grow">{node.name}</span>
                {node.id !== 'root' && (
                    <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(node)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        您确定要删除 “{node.name}” 吗？其所有下级节点也将被删除。此操作无法撤销。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(node.id)}>确认删除</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </div>
            {children.length > 0 && (
                <div className="mt-2 space-y-2">
                    {children.map(child => (
                        <OrgChartNode key={child.id} node={child} allNodes={allNodes} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}


export function OrganizationChart() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalyzeOrgStructureOutput | null>(null);
    const [orgData, setOrgData] = useState<OrgNodeData[]>(initialOrgData);
    const [importText, setImportText] = useState('');
    
    // State for the new node form
    const [newNodeName, setNewNodeName] = useState('');
    const [newNodeParent, setNewNodeParent] = useState<string>('root');
    const [editingNode, setEditingNode] = useState<OrgNodeData | null>(null);

    const rootNode = useMemo(() => orgData.find(n => n.id === 'root'), [orgData]);
    
    const getNodeAndAllChildrenIds = (nodeId: string): string[] => {
        let idsToDelete: string[] = [nodeId];
        const children = orgData.filter(n => n.parentId === nodeId);
        children.forEach(child => {
            idsToDelete = [...idsToDelete, ...getNodeAndAllChildrenIds(child.id)];
        });
        return idsToDelete;
    };

    const handleDeleteNode = (nodeId: string) => {
        const idsToDelete = getNodeAndAllChildrenIds(nodeId);
        setOrgData(prev => prev.filter(n => !idsToDelete.includes(n.id)));
        toast({ title: "节点已删除", variant: "destructive" });
    };
    
    const handleEditNode = (node: OrgNodeData) => {
        setEditingNode(node);
        setNewNodeName(node.name);
        setNewNodeParent(node.parentId || 'root');
    };

    const cancelEdit = () => {
        setEditingNode(null);
        setNewNodeName('');
        setNewNodeParent('root');
    };


    const handleAddOrUpdateNode = () => {
        if (!newNodeName.trim()) {
            toast({ title: '名称不能为空', variant: 'destructive' });
            return;
        }

        if (editingNode) {
            // Update existing node
            setOrgData(prev => prev.map(n => n.id === editingNode.id ? { ...n, name: newNodeName, parentId: newNodeParent } : n));
            toast({ title: '节点已更新' });
        } else {
            // Add new node
            const newNode: OrgNodeData = {
                id: `node-${Date.now()}`,
                name: newNodeName,
                parentId: newNodeParent,
            };
            setOrgData(prev => [...prev, newNode]);
            toast({ title: '节点已添加' });
        }
        
        cancelEdit();
    };
    
    const handleImportFromText = () => {
        if (!importText.trim()) {
            toast({ title: '导入内容不能为空', variant: 'destructive' });
            return;
        }

        try {
            const lines = importText.trim().split('\n');
            let newNodes: OrgNodeData[] = [...initialOrgData];
            let parentMap: Record<string, string> = { '公司': 'root' };

            lines.forEach(line => {
                const parts = line.split('>').map(p => p.trim());
                let currentParentId = 'root';

                parts.forEach((part, index) => {
                    if (!parentMap[part]) {
                        const newNodeId = `import-${part}-${Date.now()}`;
                        newNodes.push({ id: newNodeId, name: part, parentId: currentParentId });
                        parentMap[part] = newNodeId;
                    }
                    currentParentId = parentMap[part];
                });
            });
            
            setOrgData(newNodes);
            toast({ title: '导入成功', description: `成功解析并导入 ${newNodes.length - 1} 个新节点。` });
            setImportText('');

        } catch (error) {
             toast({ title: '导入失败', description: '解析文本时发生错误，请检查格式。', variant: 'destructive' });
        }
    };
    
    const generateOrgTextForAI = (): string => {
        const buildHierarchy = (parentId: string | null, prefix = ""): string => {
            return orgData
                .filter(node => node.parentId === parentId)
                .map(node => `${prefix}- ${node.name}\n` + buildHierarchy(node.id, prefix + "  "))
                .join("");
        };
        return buildHierarchy(null);
    }

    const handleAnalyze = async () => {
        const orgInfo = generateOrgTextForAI();
        if (!orgInfo.trim()) {
            toast({
                title: '信息不足',
                description: '组织架构为空，请先设计或导入。',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        setAnalysisResult(null);
        try {
            const result = await analyzeOrgStructure({ orgInfo });
            setAnalysisResult(result);
            toast({
                title: '分析完成',
                description: 'AI已完成对您的组织结构的分析。',
            });
        } catch (error) {
            console.error(error);
            toast({
                title: '分析失败',
                description: 'AI分析时发生错误，请稍后重试。',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>组织架构设计器</CardTitle>
                    <CardDescription>设计、导入或编辑您的企业组织架构。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Add/Edit Form */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-semibold text-md">{editingNode ? '编辑节点' : '添加新节点'}</h4>
                         <div>
                            <Label htmlFor="node-name">名称</Label>
                            <Input id="node-name" placeholder="例如：研发部" value={newNodeName} onChange={e => setNewNodeName(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="node-parent">上级</Label>
                            <Select value={newNodeParent} onValueChange={setNewNodeParent}>
                                <SelectTrigger id="node-parent">
                                    <SelectValue placeholder="选择上级节点" />
                                </SelectTrigger>
                                <SelectContent>
                                    {orgData.map(node => (
                                        <SelectItem key={node.id} value={node.id} disabled={editingNode?.id === node.id}>
                                            {node.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={handleAddOrUpdateNode} className="flex-1">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {editingNode ? '更新节点' : '添加节点'}
                            </Button>
                            {editingNode && <Button variant="ghost" onClick={cancelEdit}>取消</Button>}
                        </div>
                    </div>
                     {/* Import from Text */}
                     <div className="space-y-2">
                        <Label htmlFor="org-import" className="text-base font-medium">从文本导入</Label>
                        <Textarea 
                            id="org-import"
                            rows={5}
                            placeholder="每行一个层级关系，例如：研发部 > 前端团队"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        />
                         <p className="text-xs text-muted-foreground">
                           使用 `>` 分隔层级。例如: 市场部 > 营销组
                        </p>
                        <Button onClick={handleImportFromText} variant="outline" className="w-full">
                            <Import className="mr-2 h-4 w-4" /> 导入
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>当前组织架构</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rootNode ? 
                             <OrgChartNode node={rootNode} allNodes={orgData} onEdit={handleEditNode} onDelete={handleDeleteNode} />
                             : <p className="text-muted-foreground">组织架构为空。</p>
                        }
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI 组织分析与流程优化</CardTitle>
                        <CardDescription>
                            此项功能的意义在于，AI分析企业的组织架构、管理流程之后，可以根据员工的需求与企业决策管理之间匹配相同或类似的企业岗位、相似任务等。
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                         <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    正在分析...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    开始 AI 分析
                                </>
                            )}
                        </Button>
                    </CardContent>
                    {analysisResult && (
                        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                            <h3 className="text-xl font-semibold flex items-center"><ArrowRight className="mr-2 text-accent"/>分析结果</h3>
                            <div className="space-y-6 text-sm w-full">
                                <div>
                                    <h4 className="font-semibold text-base mb-2">关键决策点</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">{analysisResult.decisionPoints}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-base mb-2">潜在瓶颈</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">{analysisResult.potentialBottlenecks}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-base mb-2">改进建议</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">{analysisResult.improvementSuggestions}</p>
                                </div>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}

    

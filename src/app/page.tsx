
'use client'

import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import type { Message, Product, IdentificationResult } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { identifyImage, getRecommendationsFromText } from '@/app/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Textarea,
  type TextareaProps,
} from '@/components/ui/textarea_with_count'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bot,
  User,
  Image as ImageIcon,
  Send,
  ArrowRight,
  Briefcase,
  Diamond,
  Wand2,
  ExternalLink,
  Eye,
  Sparkles,
  Search,
  X,
} from 'lucide-react'
import Image from 'next/image'
import type { GenerateUserProfileOutput } from '@/ai/flows/generate-user-profile'
import type { RecommendProductsOrServicesOutput } from '@/ai/flows/recommend-products-or-services'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Home() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageDataUri, setImageDataUri] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const clearImageState = () => {
    setPreviewImage(null)
    setImageDataUri(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      clearImageState() // Clear previous image state
      setPreviewImage(URL.createObjectURL(file))

      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const dataUri = loadEvent.target?.result as string
        setImageDataUri(dataUri)
      }
      reader.readAsDataURL(file)
    }
  }

  const processRequest = async (text: string, imageUri: string | null) => {
    setIsLoading(true)
    setInput('')
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || '查看图片', // Display '查看图片' if only image is provided
      imagePreview: imageUri ? previewImage || undefined : undefined
    }
    setMessages((prev) => [...prev, userMessage])
    
    // Clear image state after it has been sent
    clearImageState()

    try {
      const aiResult = await getRecommendationsFromText({ textInput: text, imageDataUri: imageUri })

      if (!aiResult || !aiResult.userProfile || !aiResult.recommendations) {
        throw new Error('AI response is incomplete.')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '这是我为您找到的结果：',
        aiContent: aiResult,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error(error)
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.'
      toast({
        title: '发生错误',
        description: `从 AI 获取回应失败: ${errorMessage}. 请稍后重试。`,
        variant: 'destructive',
      })
      // remove the user message that caused the error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && !imageDataUri) return
    await processRequest(input, imageDataUri)
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <User className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-headline text-3xl font-bold text-primary-foreground/90">
          请先登录
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          您需要登录后才能使用智能匹配功能。
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">前往登录</Link>
        </Button>
      </div>
    )
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mb-10 flex flex-col items-center text-center">
        <h1 className="font-headline text-4xl font-bold md:text-5xl">
          欢迎光临“情动于艺”
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          与AI导购对话,发现为您量身推荐的独特设计,部分商品更支持个性化定制。
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* Left Column: AI Chat */}
        <Card className="flex h-full flex-col lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">AI购物助手</CardTitle>
            <CardDescription>
              告诉我您的想法,我会为您找到完美的作品。
            </CardDescription>
          </CardHeader>
          <CardContent
            ref={scrollRef}
            className="flex-1 space-y-6 overflow-y-auto p-6"
          >
            {messages.length === 0 && !isLoading && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 border-2 border-primary/50">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-2xl rounded-2xl bg-card p-4">
                    <p className="whitespace-pre-wrap">
                      您好!我是您的专属购物助手。请问您在寻找什么?您可以直接描述，或者上传一张图片让我看看。{' '}
                    </p>
                  </div>
                </div>
              )}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && <LoadingMessage />}
          </CardContent>
          <div className="rounded-b-lg border-t bg-background/80 p-4 backdrop-blur-sm">
            <form onSubmit={handleSendMessage} className="relative">
              {previewImage && (
                <div className="absolute bottom-full left-0 mb-2 w-fit rounded-lg border bg-card p-2 shadow-sm">
                  <Image
                    src={previewImage}
                    alt="图片预览"
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                  />
                  <Button
                    type="button"
                    onClick={clearImageState}
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:text-primary"
                  disabled={isLoading}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="例如: 我想找一个送给科幻迷的礼物..."
                  className="w-full resize-none py-2 text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                  rows={1}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || (!input.trim() && !imageDataUri)}
                >
                  <Send className="h-5 w-5" />
                  <span className="sr-only">发送</span>
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Right Column: Customization Service */}
        <div className="flex flex-col gap-8">
          {user?.role === 'creator' && (
            <Button asChild size="lg" className="w-full">
              <Link href="/creator-workbench">
                <Wand2 className="mr-2 h-5 w-5" />
                进入创作者工作台
              </Link>
            </Button>
          )}
          <Card className="border-accent/30 bg-accent/20">
            <CardHeader className="p-4 pb-2 text-center">
              <div className="mx-auto mb-2 inline-block rounded-full border-2 border-primary/20 bg-primary/10 p-2">
                <Diamond className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-headline text-lg text-primary-foreground/90">
                高端定制服务
              </CardTitle>
              <CardDescription className="mx-auto max-w-xs pt-1 text-xs">
                将您的构想变为现实。我们的顶尖设计师将与您合作,打造专属艺术品。
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-1">
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-start">
                  <ArrowRight className="mr-1.5 mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span>与专业3D艺术家深度沟通</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="mr-1.5 mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span>从草图到模型的全程跟进</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="mr-1.5 mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span>使用顶级材质和工艺制作</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-4 pt-2">
              <Button
                className="w-full bg-primary/90 text-primary-foreground hover:bg-primary"
                size="sm"
                asChild
              >
                <Link href="/designers">
                  预约设计师 (付费) <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}

function ChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant'
  const { user } = useAuth()

  return (
    <div
      className={cn(
        'flex items-start gap-3',
        !isAssistant && 'justify-end'
      )}
    >
      {isAssistant && (
        <Avatar className="h-9 w-9 border-2 border-primary/50">
          <AvatarFallback className="bg-primary/20 text-primary">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'flex max-w-2xl flex-col gap-2',
          !isAssistant && 'items-end'
        )}
      >
        <div
          className={cn(
            'rounded-2xl p-4',
            isAssistant ? 'bg-card' : 'bg-primary text-primary-foreground'
          )}
        >
          {message.imagePreview && (
            <div className="mb-2">
              <Image 
                src={message.imagePreview}
                alt="User upload"
                width={128}
                height={128}
                className="rounded-lg object-cover"
              />
            </div>
          )}
          {message.content && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          {message.aiContent?.userProfile && (
            <UserProfileDisplay profile={message.aiContent.userProfile} />
          )}
          {message.aiContent?.recommendations && (
            <RecommendationsDisplay
              recommendations={message.aiContent.recommendations}
            />
          )}
        </div>
      </div>
      {!isAssistant && (
        <Avatar className="h-9 w-9 border-2 border-muted">
          {user?.avatar ? (
            <AvatarImage src={user.avatar} alt={user.name} />
          ) : null}
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

function LoadingMessage() {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-9 w-9 border-2 border-primary/50">
        <AvatarFallback className="bg-primary/20 text-primary">
          <Bot className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex max-w-2xl flex-col gap-2">
        <div className="w-full rounded-2xl bg-card p-4">
          <div className="space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function UserProfileDisplay({
  profile,
}: {
  profile: GenerateUserProfileOutput
}) {
  return (
    <Card className="mt-4 border-primary/20 bg-background/50">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="font-headline text-lg">
          生成的用户画像
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="mb-3 text-sm text-muted-foreground">
          {profile.profileSummary}
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex flex-col overflow-hidden border-accent/20 bg-background/50">
      <div className="relative aspect-video">
        <Image
          src={product.panoramicImage}
          alt={product.name}
          fill
          className="object-cover"
          data-ai-hint="panoramic product image"
        />
      </div>
      <div className="flex flex-grow flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex-grow font-headline text-base font-semibold">
            {product.name}
          </CardTitle>
          <div className="flex-shrink-0 whitespace-nowrap text-lg font-bold text-primary">
            {product.price}
          </div>
        </div>
        <CardDescription className="mt-1 flex-grow pt-1 text-xs">
          {product.description}
        </CardDescription>
      </div>
      <CardFooter className="flex gap-2 p-4 pt-2">
        <Button size="sm" className="w-full" variant="outline" asChild>
          <Link
            href={product.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Eye className="mr-2 h-4 w-4" /> 查看详情
          </Link>
        </Button>
        <Button size="sm" className="w-full" asChild>
          <Link
            href={product.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            立即购买 <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function RecommendationsDisplay({
  recommendations,
}: {
  recommendations: RecommendProductsOrServicesOutput
}) {
  const { user } = useAuth()
  return (
    <div className="mt-4">
      <h3 className="mb-3 font-headline text-lg font-semibold">首要推荐</h3>
      <div className="grid grid-cols-1 gap-4">
        {recommendations.recommendations.map((rec, index) => (
          <ProductCard key={index} product={rec} />
        ))}
      </div>
      <Card className="mt-4 border-dashed bg-background/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="font-headline text-base">推荐理由</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {recommendations.reasoning}
          </p>
        </CardContent>
      </Card>
      {user?.role === 'user' && (
        <div className="mt-6 text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            没有找到满意的结果？
          </p>
          <Button variant="secondary" asChild>
            <Link href="/demand-pool">
              <Briefcase className="mr-2 h-4 w-4" />
              发布到需求池
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

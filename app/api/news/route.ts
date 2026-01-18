import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import Parser from "rss-parser";

// RSSフィードから実際のニュースを取得
const RSS_FEEDS = [
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "Ars Technica AI", url: "https://feeds.arstechnica.com/arstechnica/technology-lab" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
];

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  content?: string;
  source: string;
}

async function fetchRealNews(): Promise<RSSItem[]> {
  const parser = new Parser();
  const allItems: RSSItem[] = [];
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  for (const feed of RSS_FEEDS) {
    try {
      const result = await parser.parseURL(feed.url);
      const items = result.items
        .filter((item) => {
          if (!item.pubDate) return false;
          const pubDate = new Date(item.pubDate);
          return pubDate >= twoDaysAgo;
        })
        .slice(0, 3)
        .map((item) => ({
          title: item.title || "タイトルなし",
          link: item.link || "",
          pubDate: item.pubDate || "",
          contentSnippet: item.contentSnippet || item.content || "",
          source: feed.name,
        }));
      allItems.push(...items);
    } catch (error) {
      console.error(`Failed to fetch ${feed.name}:`, error);
    }
  }

  // 日付でソートして最新3件を返す
  return allItems
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 3);
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEYが設定されていません。" },
      { status: 500 }
    );
  }

  try {
    // 1. 実際のニュースをRSSから取得
    const realNews = await fetchRealNews();
    
    if (realNews.length === 0) {
      return NextResponse.json(
        { error: "ニュースを取得できませんでした。しばらく後で再試行してください。" },
        { status: 500 }
      );
    }

    // 2. Geminiで要約と図解を生成
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const newsData = realNews.map((item, index) => ({
      index: index + 1,
      title: item.title,
      source: item.source,
      url: item.link,
      publishedAt: new Date(item.pubDate).toISOString().split('T')[0],
      snippet: item.contentSnippet?.substring(0, 500) || "",
    }));

    const prompt = `
# Role: 世界最高峰のインフォグラフィック・デザイナー

あなたはCanvaやGoogleのデザインチームに匹敵する、超一流のインフォグラフィック・デザイナーです。
「視線誘導」「余白の美学」「情報の階層化」を完璧に理解しています。

## ニュース記事データ
${JSON.stringify(newsData, null, 2)}

## 作成物

### 1. summary（日本語要約 300-400文字）
- 何が発表されたか（具体的な技術・製品名）
- なぜ業界にとって重要なのか
- 誰がどのような影響を受けるか
- 今後の展開予測

### 2. visualHtml（Canva品質のインフォグラフィック）

## 🎨 デザイン哲学（絶対遵守）

### 禁止事項
❌ 単純なborderで囲った四角形
❌ 「→」という文字だけの矢印
❌ 均一なフォントサイズ
❌ 余白のない詰め込みデザイン
❌ 単色の平坦な背景

### 必須要素
✅ グラデーション背景（bg-gradient-to-br from-X to-Y）
✅ 柔らかい角丸（rounded-2xl, rounded-3xl）
✅ 影による奥行き（shadow-lg, shadow-xl）
✅ 情報の階層化（ヒーロー数字は text-5xl font-black）
✅ 十分な余白（p-6以上、gap-4以上）
✅ グラスモーフィズム効果（bg-white/80 backdrop-blur-sm）

## 📐 テンプレート集（これを基に創造的にアレンジせよ）

### 【テンプレート1: 技術アーキテクチャ型】新技術・システム解説用
<div class="relative">
  <!-- ヘッダー -->
  <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-t-3xl p-6 text-white">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-3xl">🏗️</span>
      <h4 class="text-xl font-bold">システムアーキテクチャ</h4>
    </div>
    <p class="text-white/80 text-sm">新技術の構造を視覚化</p>
  </div>
  
  <!-- メインコンテンツ -->
  <div class="bg-gradient-to-b from-slate-50 to-white p-6 rounded-b-3xl">
    <!-- レイヤー構造 -->
    <div class="space-y-3">
      <!-- Layer 1 -->
      <div class="bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/20 text-center">
        <div class="font-bold text-lg">🖥️ ユーザーインターフェース</div>
        <div class="text-sm text-white/80">自然言語での対話</div>
      </div>
      
      <!-- 接続線 -->
      <div class="flex justify-center">
        <div class="w-1 h-6 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full"></div>
      </div>
      
      <!-- Layer 2 -->
      <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl shadow-lg shadow-purple-500/20 text-center">
        <div class="font-bold text-lg">🧠 AIエンジン</div>
        <div class="text-sm text-white/80">推論・生成処理</div>
      </div>
      
      <!-- 接続線 -->
      <div class="flex justify-center">
        <div class="w-1 h-6 bg-gradient-to-b from-pink-500 to-emerald-500 rounded-full"></div>
      </div>
      
      <!-- Layer 3 -->
      <div class="bg-gradient-to-r from-emerald-500 to-teal-400 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/20 text-center">
        <div class="font-bold text-lg">💾 データレイヤー</div>
        <div class="text-sm text-white/80">学習データ・知識ベース</div>
      </div>
    </div>
  </div>
</div>

### 【テンプレート2: ヒーロー数値型】資金調達・成長・統計用
<div class="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
  <!-- 装飾 -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
  <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
  
  <!-- メイン数値 -->
  <div class="relative text-center mb-8">
    <div class="text-7xl font-black tracking-tight mb-2">$500M</div>
    <div class="text-xl text-white/80">資金調達額</div>
  </div>
  
  <!-- サブ指標 -->
  <div class="relative grid grid-cols-3 gap-4">
    <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
      <div class="text-3xl font-bold">10x</div>
      <div class="text-sm text-white/70">成長率</div>
    </div>
    <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
      <div class="text-3xl font-bold">50+</div>
      <div class="text-sm text-white/70">パートナー</div>
    </div>
    <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
      <div class="text-3xl font-bold">1M</div>
      <div class="text-sm text-white/70">ユーザー</div>
    </div>
  </div>
</div>

### 【テンプレート3: プロセスフロー型】処理の流れ・ワークフロー用
<div class="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-6">
  <h4 class="text-center text-lg font-bold text-slate-800 mb-6 flex items-center justify-center gap-2">
    <span class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">⚡</span>
    処理フロー
  </h4>
  
  <div class="flex items-center justify-between gap-2 flex-wrap">
    <!-- Step 1 -->
    <div class="flex-1 min-w-[100px]">
      <div class="bg-white rounded-2xl p-4 shadow-lg shadow-blue-500/10 text-center border-2 border-blue-100">
        <div class="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/30">📝</div>
        <div class="font-bold text-slate-800">入力</div>
        <div class="text-xs text-slate-500 mt-1">テキスト・画像</div>
      </div>
    </div>
    
    <!-- Arrow -->
    <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">→</div>
    
    <!-- Step 2 -->
    <div class="flex-1 min-w-[100px]">
      <div class="bg-white rounded-2xl p-4 shadow-lg shadow-purple-500/10 text-center border-2 border-purple-100">
        <div class="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-purple-500/30">🧠</div>
        <div class="font-bold text-slate-800">AI分析</div>
        <div class="text-xs text-slate-500 mt-1">深層学習処理</div>
      </div>
    </div>
    
    <!-- Arrow -->
    <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">→</div>
    
    <!-- Step 3 -->
    <div class="flex-1 min-w-[100px]">
      <div class="bg-white rounded-2xl p-4 shadow-lg shadow-emerald-500/10 text-center border-2 border-emerald-100">
        <div class="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-500/30">✨</div>
        <div class="font-bold text-slate-800">出力</div>
        <div class="text-xs text-slate-500 mt-1">生成結果</div>
      </div>
    </div>
  </div>
</div>

### 【テンプレート4: Before/After比較型】性能向上・改善用
<div class="bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl p-6">
  <h4 class="text-center text-lg font-bold text-slate-800 mb-6">📊 性能比較</h4>
  
  <div class="grid grid-cols-2 gap-4">
    <!-- Before -->
    <div class="relative">
      <div class="absolute -top-3 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">BEFORE</div>
      <div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 pt-6 border-2 border-red-200">
        <div class="text-center">
          <div class="text-4xl font-black text-red-500 mb-1">10秒</div>
          <div class="text-sm text-slate-600">処理時間</div>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">精度</span>
            <span class="font-bold text-red-500">75%</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">コスト</span>
            <span class="font-bold text-red-500">$100</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- After -->
    <div class="relative">
      <div class="absolute -top-3 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">AFTER</div>
      <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 pt-6 border-2 border-emerald-200 shadow-lg shadow-emerald-500/10">
        <div class="text-center">
          <div class="text-4xl font-black text-emerald-500 mb-1">1秒</div>
          <div class="text-sm text-slate-600">処理時間</div>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">精度</span>
            <span class="font-bold text-emerald-500">95%</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">コスト</span>
            <span class="font-bold text-emerald-500">$10</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 改善ハイライト -->
  <div class="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white text-center">
    <span class="text-2xl font-black">🚀 10倍高速化 & 90%コスト削減</span>
  </div>
</div>

### 【テンプレート5: 対立構造型】訴訟・競争・比較用
<div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
  <h4 class="text-center text-lg font-bold mb-6 flex items-center justify-center gap-2">
    <span>⚔️</span> 対立構造
  </h4>
  
  <div class="flex items-center gap-4">
    <!-- 左陣営 -->
    <div class="flex-1 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-center">
      <div class="text-4xl mb-3">🏢</div>
      <div class="text-xl font-bold">Company A</div>
      <div class="text-sm text-blue-200 mt-2">原告側</div>
    </div>
    
    <!-- VS -->
    <div class="flex-shrink-0">
      <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-2xl font-black shadow-lg shadow-red-500/30">VS</div>
    </div>
    
    <!-- 右陣営 -->
    <div class="flex-1 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-center">
      <div class="text-4xl mb-3">🏢</div>
      <div class="text-xl font-bold">Company B</div>
      <div class="text-sm text-purple-200 mt-2">被告側</div>
    </div>
  </div>
  
  <!-- 争点 -->
  <div class="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
    <div class="text-sm text-slate-300">争点</div>
    <div class="font-bold mt-1">知的財産権の侵害</div>
  </div>
</div>

## 出力形式
以下のJSON形式のみを出力（説明文は一切不要）：
{
  "results": [
    {
      "index": 1,
      "summary": "日本語の詳細要約（300-400文字）",
      "visualHtml": "上記テンプレートを参考に、ニュース内容に最適化した美しいHTML"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("JSONが見つかりません:", text);
      return NextResponse.json(
        { error: "AIからの応答を解析できませんでした" },
        { status: 500 }
      );
    }

    const aiResults = JSON.parse(jsonMatch[0]);
    
    // 実際のニュースデータとAI生成データを結合
    const finalNews = newsData.map((news, index) => {
      const aiResult = aiResults.results?.find((r: { index: number }) => r.index === index + 1) || {};
      return {
        title: news.title,
        publishedAt: news.publishedAt,
        source: news.source.replace(" AI", ""),
        summary: aiResult.summary || "要約を生成できませんでした",
        url: news.url,
        visualHtml: aiResult.visualHtml || "<div class='p-4 bg-gray-100 rounded'>図解を生成できませんでした</div>",
      };
    });

    return NextResponse.json({ news: finalNews });
  } catch (error) {
    console.error("APIエラー:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      { error: "生成に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}

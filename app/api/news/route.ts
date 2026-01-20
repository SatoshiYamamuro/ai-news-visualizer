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

### 1. titleJa（日本語タイトル）
- 英語のタイトルを自然な日本語に翻訳
- ニュースの核心を捉えた分かりやすいタイトル

### 2. summary（日本語要約 300-400文字）
- 何が発表されたか（具体的な技術・製品名）
- なぜ業界にとって重要なのか
- 誰がどのような影響を受けるか
- 今後の展開予測

### 3. visualHtml（Canva品質のインフォグラフィック）

## 🎨 デザイン哲学（絶対遵守）

### 禁止事項
❌ 単純なborderで囲った四角形
❌ 「→」という文字だけの矢印
❌ 均一なフォントサイズ
❌ 余白のない詰め込みデザイン
❌ 単色の平坦な背景
❌❌❌ 白背景に白文字（絶対禁止！読めなくなる）
❌❌❌ 薄い背景に薄い文字（コントラスト不足は致命的）

### 必須要素
✅ グラデーション背景（bg-gradient-to-br from-X to-Y）
✅ 柔らかい角丸（rounded-2xl, rounded-3xl）
✅ 影による奥行き（shadow-lg, shadow-xl）
✅ 情報の階層化（ヒーロー数字は text-5xl font-black）
✅ 十分な余白（p-6以上、gap-4以上）
✅ 高コントラスト配色（暗い背景→白文字、明るい背景→濃い文字）

### ⚠️ 配色ルール（これ以外の組み合わせは禁止）

【許可される配色パターン - 必ずこの中から選ぶこと】

■ パターンA: ダーク背景（高級感・重厚感）
背景: bg-slate-800, bg-slate-900, bg-gray-800, bg-gray-900
文字: text-white（メイン）, text-slate-200, text-gray-200（サブ）

■ パターンB: カラー背景（アクセント・強調）
背景: bg-blue-600, bg-indigo-600, bg-purple-600, bg-emerald-600, bg-rose-600
文字: text-white（必須）

■ パターンC: ライト背景（清潔感・読みやすさ）
背景: bg-white, bg-slate-50, bg-gray-50, bg-slate-100
文字: text-slate-800, text-slate-900, text-gray-800, text-gray-900

■ パターンD: パステル背景（柔らかさ）
背景: bg-blue-50, bg-indigo-50, bg-purple-50, bg-emerald-50
文字: text-blue-900, text-indigo-900, text-purple-900, text-emerald-900

■ パターンE: グラデーション背景
背景: bg-gradient-to-r from-blue-600 to-indigo-600（濃い色同士）
文字: text-white（必須）

背景: bg-gradient-to-br from-slate-50 to-blue-50（薄い色同士）
文字: text-slate-800, text-slate-900

【絶対禁止の組み合わせ】
❌ bg-white + text-white
❌ bg-slate-50 + text-slate-100（薄い×薄い）
❌ bg-slate-800 + text-slate-700（濃い×濃い）
❌ bg-blue-500 + text-blue-600（同系色）
❌ 背景と文字の明度が近い組み合わせすべて

## 📐 テンプレート集（これを基に創造的にアレンジせよ）

### 【テンプレート1: 技術アーキテクチャ型】新技術・システム解説用
<div class="relative">
  <!-- ヘッダー（濃いグラデーション→白文字）-->
  <div class="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-t-3xl p-6">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-3xl">🏗️</span>
      <h4 class="text-xl font-bold text-white">システムアーキテクチャ</h4>
    </div>
    <p class="text-indigo-100 text-sm">新技術の構造を視覚化</p>
  </div>
  
  <!-- メインコンテンツ（薄い背景→濃い文字）-->
  <div class="bg-slate-100 p-6 rounded-b-3xl">
    <div class="space-y-3">
      <!-- Layer 1（濃い青→白文字）-->
      <div class="bg-blue-600 p-4 rounded-2xl shadow-lg text-center">
        <div class="font-bold text-lg text-white">🖥️ ユーザーインターフェース</div>
        <div class="text-sm text-blue-100">自然言語での対話</div>
      </div>
      
      <div class="flex justify-center">
        <div class="w-1 h-6 bg-purple-400 rounded-full"></div>
      </div>
      
      <!-- Layer 2（濃い紫→白文字）-->
      <div class="bg-purple-600 p-4 rounded-2xl shadow-lg text-center">
        <div class="font-bold text-lg text-white">🧠 AIエンジン</div>
        <div class="text-sm text-purple-100">推論・生成処理</div>
      </div>
      
      <div class="flex justify-center">
        <div class="w-1 h-6 bg-emerald-400 rounded-full"></div>
      </div>
      
      <!-- Layer 3（濃い緑→白文字）-->
      <div class="bg-emerald-600 p-4 rounded-2xl shadow-lg text-center">
        <div class="font-bold text-lg text-white">💾 データレイヤー</div>
        <div class="text-sm text-emerald-100">学習データ・知識ベース</div>
      </div>
    </div>
  </div>
</div>

### 【テンプレート2: ヒーロー数値型】資金調達・成長・統計用
<div class="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-8 relative overflow-hidden">
  <!-- 装飾 -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
  <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>
  
  <!-- メイン数値（白文字で高コントラスト）-->
  <div class="relative text-center mb-8">
    <div class="text-7xl font-black tracking-tight mb-2 text-white">$500M</div>
    <div class="text-xl text-indigo-200">資金調達額</div>
  </div>
  
  <!-- サブ指標（濃い背景に白文字）-->
  <div class="relative grid grid-cols-3 gap-4">
    <div class="bg-indigo-800/80 rounded-2xl p-4 text-center">
      <div class="text-3xl font-bold text-white">10x</div>
      <div class="text-sm text-indigo-200">成長率</div>
    </div>
    <div class="bg-purple-800/80 rounded-2xl p-4 text-center">
      <div class="text-3xl font-bold text-white">50+</div>
      <div class="text-sm text-purple-200">パートナー</div>
    </div>
    <div class="bg-slate-800/80 rounded-2xl p-4 text-center">
      <div class="text-3xl font-bold text-white">1M</div>
      <div class="text-sm text-slate-300">ユーザー</div>
    </div>
  </div>
</div>

### 【テンプレート3: プロセスフロー型】処理の流れ・ワークフロー用
<div class="bg-slate-100 rounded-3xl p-6">
  <h4 class="text-center text-lg font-bold text-slate-900 mb-6 flex items-center justify-center gap-2">
    <span class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">⚡</span>
    処理フロー
  </h4>
  
  <div class="flex items-center justify-between gap-2 flex-wrap">
    <!-- Step 1（白背景→濃い文字）-->
    <div class="flex-1 min-w-[100px]">
      <div class="bg-white rounded-2xl p-4 shadow-lg text-center border border-slate-200">
        <div class="w-12 h-12 mx-auto mb-3 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl">📝</div>
        <div class="font-bold text-slate-900">入力</div>
        <div class="text-xs text-slate-600 mt-1">テキスト・画像</div>
      </div>
    </div>
    
    <!-- Arrow（濃い背景→白文字）-->
    <div class="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">→</div>
    
    <!-- Step 2 -->
    <div class="flex-1 min-w-[100px]">
      <div class="bg-white rounded-2xl p-4 shadow-lg text-center border border-slate-200">
        <div class="w-12 h-12 mx-auto mb-3 bg-purple-600 rounded-xl flex items-center justify-center text-white text-xl">🧠</div>
        <div class="font-bold text-slate-900">AI分析</div>
        <div class="text-xs text-slate-600 mt-1">深層学習処理</div>
      </div>
    </div>
    
    <!-- Arrow -->
    <div class="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">→</div>
    
    <!-- Step 3 -->
    <div class="flex-1 min-w-[100px]">
      <div class="bg-white rounded-2xl p-4 shadow-lg text-center border border-slate-200">
        <div class="w-12 h-12 mx-auto mb-3 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xl">✨</div>
        <div class="font-bold text-slate-900">出力</div>
        <div class="text-xs text-slate-600 mt-1">生成結果</div>
      </div>
    </div>
  </div>
</div>

### 【テンプレート4: Before/After比較型】性能向上・改善用
<div class="bg-slate-100 rounded-3xl p-6">
  <h4 class="text-center text-lg font-bold text-slate-900 mb-6">📊 性能比較</h4>
  
  <div class="grid grid-cols-2 gap-4">
    <!-- Before（薄いピンク背景→濃い赤文字）-->
    <div class="relative">
      <div class="absolute -top-3 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">BEFORE</div>
      <div class="bg-red-50 rounded-2xl p-5 pt-6 border-2 border-red-200">
        <div class="text-center">
          <div class="text-4xl font-black text-red-700 mb-1">10秒</div>
          <div class="text-sm text-slate-700">処理時間</div>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-slate-700">精度</span>
            <span class="font-bold text-red-700">75%</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-700">コスト</span>
            <span class="font-bold text-red-700">$100</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- After（薄い緑背景→濃い緑文字）-->
    <div class="relative">
      <div class="absolute -top-3 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">AFTER</div>
      <div class="bg-emerald-50 rounded-2xl p-5 pt-6 border-2 border-emerald-200 shadow-lg">
        <div class="text-center">
          <div class="text-4xl font-black text-emerald-700 mb-1">1秒</div>
          <div class="text-sm text-slate-700">処理時間</div>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-slate-700">精度</span>
            <span class="font-bold text-emerald-700">95%</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-700">コスト</span>
            <span class="font-bold text-emerald-700">$10</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 改善ハイライト（濃い緑背景→白文字）-->
  <div class="mt-4 bg-emerald-600 rounded-2xl p-4 text-center">
    <span class="text-2xl font-black text-white">🚀 10倍高速化 & 90%コスト削減</span>
  </div>
</div>

### 【テンプレート5: 対立構造型】訴訟・競争・比較用
<div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6">
  <h4 class="text-center text-lg font-bold mb-6 flex items-center justify-center gap-2 text-white">
    <span>⚔️</span> 対立構造
  </h4>
  
  <div class="flex items-center gap-4">
    <!-- 左陣営（濃い背景に白文字）-->
    <div class="flex-1 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-center">
      <div class="text-4xl mb-3">🏢</div>
      <div class="text-xl font-bold text-white">企業A</div>
      <div class="text-sm text-blue-200 mt-2">原告側</div>
    </div>
    
    <!-- VS（赤背景に白文字）-->
    <div class="flex-shrink-0">
      <div class="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-red-500/30">VS</div>
    </div>
    
    <!-- 右陣営（濃い背景に白文字）-->
    <div class="flex-1 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-center">
      <div class="text-4xl mb-3">🏢</div>
      <div class="text-xl font-bold text-white">企業B</div>
      <div class="text-sm text-purple-200 mt-2">被告側</div>
    </div>
  </div>
  
  <!-- 争点（濃い背景に明るい文字）-->
  <div class="mt-4 bg-slate-700 rounded-2xl p-4 text-center">
    <div class="text-sm text-slate-300">争点</div>
    <div class="font-bold mt-1 text-white">知的財産権の侵害</div>
  </div>
</div>

## 出力形式
以下のJSON形式のみを出力（説明文は一切不要）：
{
  "results": [
    {
      "index": 1,
      "titleJa": "日本語に翻訳したニュースタイトル",
      "summary": "日本語の詳細要約（300-400文字）",
      "visualHtml": "上記テンプレートを参考に、高コントラストで見やすい美しいHTML"
    }
  ]
}
`;

    // リトライロジック（503エラー対策）
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // 指数バックオフ: 2秒、4秒、8秒
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`リトライ ${attempt}/${maxRetries - 1} - ${delay}ms待機...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
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
            title: aiResult.titleJa || news.title, // 日本語タイトルを優先
            publishedAt: news.publishedAt,
            source: news.source.replace(" AI", ""),
            summary: aiResult.summary || "要約を生成できませんでした",
            url: news.url,
            visualHtml: aiResult.visualHtml || "<div class='p-4 bg-gray-100 rounded'>図解を生成できませんでした</div>",
          };
        });

        return NextResponse.json({ news: finalNews });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;
        
        // 503エラー（過負荷）の場合はリトライ
        if (errorMessage.includes("503") || errorMessage.includes("overloaded")) {
          console.warn(`試行 ${attempt + 1}/${maxRetries} 失敗: ${errorMessage}`);
          if (attempt < maxRetries - 1) {
            continue; // リトライ
          }
        }
        
        // 503以外のエラー、またはリトライ上限到達
        console.error("APIエラー:", error);
        return NextResponse.json(
          { 
            error: errorMessage.includes("503") || errorMessage.includes("overloaded")
              ? "Gemini APIが過負荷です。しばらく待ってから再試行してください。"
              : "生成に失敗しました",
            details: errorMessage,
            retryable: errorMessage.includes("503") || errorMessage.includes("overloaded")
          },
          { status: 503 }
        );
      }
    }
    
    // ここには到達しないはずだが、念のため
    return NextResponse.json(
      { 
        error: "生成に失敗しました（リトライ上限に達しました）",
        details: lastError?.message || "不明なエラー"
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("予期しないエラー:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      { error: "生成に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}

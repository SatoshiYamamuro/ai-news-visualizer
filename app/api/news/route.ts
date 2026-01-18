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
あなたはAI技術に精通したテクノロジージャーナリストです。

以下の実際のニュース記事に対して、日本語の要約と視覚的な図解を作成してください。

【ニュース記事データ】
${JSON.stringify(newsData, null, 2)}

【各ニュースに対して作成するもの】
1. summary: ニュースの詳細な日本語要約（250-350文字）
   - 何が発表/発見されたか
   - なぜ重要なのか
   - 誰に影響があるか
   - 今後の展望

2. visualHtml: 直感的に理解できる図解HTML

【図解の設計原則】
図解とは「文字の羅列」ではなく「空間配置と視覚要素で情報の関係性を示す」もの。

■ 必須要素：
- 矢印（→、↓、⟶）で流れや因果関係を表現
- 色分けでカテゴリを区別（青=入力、緑=処理/成功、赤=出力/警告）
- 絵文字でアイコン代わり（🤖🧠💡🚀📊⚡）
- グリッドやフレックスで空間的に配置

■ 図解パターン例：

【フローチャート型】
<div class="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-2xl border-2 border-blue-200">
  <h4 class="text-center text-lg font-bold text-blue-900 mb-6">🔄 処理の流れ</h4>
  <div class="flex items-center justify-center gap-2 flex-wrap">
    <div class="bg-blue-500 text-white px-4 py-3 rounded-xl text-center min-w-[90px]">
      <div class="text-2xl mb-1">📥</div>
      <div class="font-bold text-sm">入力</div>
    </div>
    <div class="text-3xl text-blue-400">→</div>
    <div class="bg-purple-500 text-white px-4 py-3 rounded-xl text-center min-w-[90px]">
      <div class="text-2xl mb-1">🧠</div>
      <div class="font-bold text-sm">AI処理</div>
    </div>
    <div class="text-3xl text-purple-400">→</div>
    <div class="bg-green-500 text-white px-4 py-3 rounded-xl text-center min-w-[90px]">
      <div class="text-2xl mb-1">📤</div>
      <div class="font-bold text-sm">出力</div>
    </div>
  </div>
</div>

【比較型】
<div class="bg-white p-6 rounded-2xl border-2 border-slate-200">
  <h4 class="text-center text-lg font-bold mb-4">📊 性能比較</h4>
  <div class="grid grid-cols-2 gap-4">
    <div class="bg-red-50 border-2 border-red-200 p-4 rounded-xl">
      <div class="text-center text-red-600 font-bold mb-2">❌ 従来</div>
      <div class="text-center text-2xl font-bold">10秒</div>
    </div>
    <div class="bg-green-50 border-2 border-green-200 p-4 rounded-xl">
      <div class="text-center text-green-600 font-bold mb-2">✅ 新版</div>
      <div class="text-center text-2xl font-bold text-green-600">1秒</div>
    </div>
  </div>
</div>

【数値ハイライト型】
<div class="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl">
  <div class="grid grid-cols-3 gap-3">
    <div class="bg-white p-4 rounded-xl shadow text-center">
      <div class="text-3xl font-black text-indigo-600">95%</div>
      <div class="text-xs text-slate-600">精度</div>
    </div>
    <div class="bg-white p-4 rounded-xl shadow text-center">
      <div class="text-3xl font-black text-purple-600">10x</div>
      <div class="text-xs text-slate-600">高速化</div>
    </div>
    <div class="bg-white p-4 rounded-xl shadow text-center">
      <div class="text-3xl font-black text-pink-600">50%</div>
      <div class="text-xs text-slate-600">コスト減</div>
    </div>
  </div>
</div>

【出力形式】
以下のJSON形式のみを出力（説明文不要）：
{
  "results": [
    {
      "index": 1,
      "summary": "日本語の詳細要約",
      "visualHtml": "図解HTML"
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

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEYが設定されていません。" },
      { status: 500 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Gemini 2.5 Flash モデルを使用
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const today = new Date();
    const dateStr = today.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const prompt = `
あなたは最新AI技術に精通したテクノロジージャーナリストです。
今日は${dateStr}です。

【重要な任務】
Google検索を使用して、過去48時間以内に公開された最新のAI関連ニュースを3つ見つけてください。

【ソースの絶対条件】
- 実際にアクセス可能なURLのみを使用すること
- 検索で見つけた実際のニュース記事のURLを使用すること
- 公開日が明確に分かるニュースのみを選択すること
- 以下の信頼できるソースを優先:
  * TechCrunch, The Verge, Wired, Ars Technica, VentureBeat
  * OpenAI Blog, Google AI Blog, Anthropic, Microsoft AI Blog
  * Reuters Technology, BBC Technology, NHK, 日経新聞

【図解の設計原則 - これが最重要】

図解とは「文字の羅列」ではありません。
図解とは「空間配置と視覚要素で情報の関係性を一目で理解させる」ものです。

■ 図解の5大原則：
1. 空間配置: 左→右で時間の流れ、上→下で階層、近い＝関連が強い
2. 接続表現: 矢印(→、↓、⟶)で因果関係やフローを示す
3. 囲み/グループ化: 関連要素をボックスで囲んでグループ化
4. 色の意味: 青=入力/開始、緑=処理/成功、赤=出力/注意、黄=ポイント
5. サイズの強弱: 重要なものは大きく、補足は小さく

■ 必須の図解パターン（ニュース内容に応じて選択）：

【パターン1: フローチャート型】技術の仕組み、処理の流れに使用
<div class="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-2xl border-2 border-blue-200">
  <h4 class="text-center text-lg font-bold text-blue-900 mb-6">🔄 処理フロー</h4>
  <div class="flex items-center justify-center gap-2">
    <div class="bg-blue-500 text-white px-4 py-3 rounded-xl text-center min-w-[100px]">
      <div class="text-2xl mb-1">📥</div>
      <div class="font-bold">入力</div>
      <div class="text-xs opacity-80">テキスト</div>
    </div>
    <div class="text-3xl text-blue-400">→</div>
    <div class="bg-purple-500 text-white px-4 py-3 rounded-xl text-center min-w-[100px]">
      <div class="text-2xl mb-1">🧠</div>
      <div class="font-bold">AI処理</div>
      <div class="text-xs opacity-80">分析・生成</div>
    </div>
    <div class="text-3xl text-purple-400">→</div>
    <div class="bg-green-500 text-white px-4 py-3 rounded-xl text-center min-w-[100px]">
      <div class="text-2xl mb-1">📤</div>
      <div class="font-bold">出力</div>
      <div class="text-xs opacity-80">結果</div>
    </div>
  </div>
  <div class="mt-4 bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded">
    <span class="font-bold text-yellow-800">💡 ポイント:</span>
    <span class="text-yellow-900">処理速度が従来比10倍</span>
  </div>
</div>

【パターン2: Before/After比較型】改善、アップデートに使用
<div class="bg-white p-6 rounded-2xl border-2 border-slate-200">
  <h4 class="text-center text-lg font-bold text-slate-800 mb-4">📊 性能比較</h4>
  <div class="grid grid-cols-2 gap-4">
    <div class="bg-red-50 border-2 border-red-200 p-4 rounded-xl">
      <div class="text-center text-red-600 font-bold mb-3">❌ 従来</div>
      <div class="space-y-2">
        <div class="flex justify-between"><span>速度</span><span class="font-mono">10秒</span></div>
        <div class="flex justify-between"><span>精度</span><span class="font-mono">75%</span></div>
        <div class="flex justify-between"><span>コスト</span><span class="font-mono">$100</span></div>
      </div>
    </div>
    <div class="bg-green-50 border-2 border-green-200 p-4 rounded-xl">
      <div class="text-center text-green-600 font-bold mb-3">✅ 新版</div>
      <div class="space-y-2">
        <div class="flex justify-between"><span>速度</span><span class="font-mono font-bold text-green-600">1秒</span></div>
        <div class="flex justify-between"><span>精度</span><span class="font-mono font-bold text-green-600">95%</span></div>
        <div class="flex justify-between"><span>コスト</span><span class="font-mono font-bold text-green-600">$10</span></div>
      </div>
    </div>
  </div>
  <div class="mt-4 text-center">
    <span class="bg-green-500 text-white px-4 py-2 rounded-full font-bold">🚀 10倍高速化！</span>
  </div>
</div>

【パターン3: 階層/構造型】システム構成、組織に使用
<div class="bg-gradient-to-b from-indigo-50 to-purple-50 p-6 rounded-2xl border-2 border-indigo-200">
  <h4 class="text-center text-lg font-bold text-indigo-900 mb-4">🏗️ システム構成</h4>
  <div class="flex flex-col items-center gap-2">
    <div class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">ユーザーインターフェース</div>
    <div class="text-2xl text-indigo-400">↓</div>
    <div class="bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold">APIレイヤー</div>
    <div class="text-2xl text-indigo-400">↓</div>
    <div class="flex gap-4">
      <div class="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm">モデルA</div>
      <div class="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm">モデルB</div>
      <div class="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm">モデルC</div>
    </div>
    <div class="text-2xl text-purple-400">↓</div>
    <div class="bg-slate-700 text-white px-6 py-3 rounded-xl font-bold">データベース</div>
  </div>
</div>

【パターン4: 数値ハイライト型】ベンチマーク、統計に使用
<div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-200">
  <h4 class="text-center text-lg font-bold text-emerald-900 mb-4">📈 主要な数値</h4>
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white p-4 rounded-xl shadow-md text-center">
      <div class="text-4xl font-black text-emerald-600">95%</div>
      <div class="text-sm text-slate-600 mt-1">精度向上</div>
    </div>
    <div class="bg-white p-4 rounded-xl shadow-md text-center">
      <div class="text-4xl font-black text-blue-600">10x</div>
      <div class="text-sm text-slate-600 mt-1">高速化</div>
    </div>
    <div class="bg-white p-4 rounded-xl shadow-md text-center">
      <div class="text-4xl font-black text-purple-600">50%</div>
      <div class="text-sm text-slate-600 mt-1">コスト削減</div>
    </div>
  </div>
</div>

【パターン5: タイムライン型】歴史、ロードマップに使用
<div class="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200">
  <h4 class="text-center text-lg font-bold text-slate-800 mb-4">📅 開発ロードマップ</h4>
  <div class="relative">
    <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-blue-300 -translate-x-1/2"></div>
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <div class="w-1/2 text-right pr-4">
          <div class="font-bold text-blue-600">2024年Q1</div>
          <div class="text-sm text-slate-600">ベータ版リリース</div>
        </div>
        <div class="w-4 h-4 bg-blue-500 rounded-full z-10"></div>
        <div class="w-1/2"></div>
      </div>
      <div class="flex items-center gap-4">
        <div class="w-1/2"></div>
        <div class="w-4 h-4 bg-green-500 rounded-full z-10"></div>
        <div class="w-1/2 pl-4">
          <div class="font-bold text-green-600">2024年Q2</div>
          <div class="text-sm text-slate-600">正式リリース</div>
        </div>
      </div>
    </div>
  </div>
</div>

【出力形式】
以下のJSON形式のみを出力してください。説明文は不要です：

{
  "news": [
    {
      "title": "具体的で分かりやすいタイトル（日本語）",
      "publishedAt": "YYYY-MM-DD（実際の公開日）",
      "source": "メディア名",
      "summary": "何が発表されたか、なぜ重要か、誰に影響があるか、今後どうなるかを含む詳細な要約（250-350文字）",
      "url": "検索で見つけた実際のURL",
      "visualHtml": "上記パターンを参考に、ニュース内容に最適な図解HTML（必ず矢印や空間配置を使った視覚的な図解にすること）"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("JSONが見つかりません:", text);
      return NextResponse.json(
        { error: "AIからの応答を解析できませんでした", details: text.substring(0, 500) },
        { status: 500 }
      );
    }

    const jsonStr = jsonMatch[0];
    const parsedData = JSON.parse(jsonStr);
    
    if (!parsedData.news || !Array.isArray(parsedData.news)) {
      return NextResponse.json(
        { error: "予期しないデータ形式です" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("APIエラー:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      { error: "生成に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}

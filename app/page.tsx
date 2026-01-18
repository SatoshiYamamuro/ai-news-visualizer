"use client";

import { useEffect, useState } from "react";
import { NewsItem } from "@/types/news";

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/news");
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error || "ニュースの取得に失敗しました";
        const details = data.details ? `\n詳細: ${data.details}` : "";
        throw new Error(`${errorMsg}${details}`);
      }
      
      if (data.error) {
        throw new Error(data.error + (data.details ? `\n詳細: ${data.details}` : ""));
      }
      
      setNews(data.news || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      console.error("エラー詳細:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ヒーローセクション */}
      <header className="relative overflow-hidden">
        {/* 装飾的な背景要素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative container mx-auto px-4 py-12 md:py-20 max-w-6xl">
          <div className="text-center animate-fade-in-up">
            {/* ロゴ/タイトル */}
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-2xl">🤖</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                <span className="gradient-text">AI News</span>
                <span className="text-slate-800 dark:text-white"> Visualizer</span>
              </h1>
            </div>
            
            {/* サブタイトル */}
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              最新のAIニュースを、<span className="font-semibold text-indigo-600 dark:text-indigo-400">美しいインフォグラフィック</span>で直感的に理解
            </p>
            
            {/* CTAボタン */}
            <button
              onClick={fetchNews}
              disabled={loading}
              className="btn-gradient text-lg px-8 py-4 rounded-2xl inline-flex items-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AIが分析中...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  <span>最新ニュースを取得</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 pb-16 max-w-6xl">
        {/* エラー表示 */}
        {error && (
          <div className="mb-8 animate-fade-in">
            <div className="glass-card p-6 border-l-4 border-red-500">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-600 dark:text-red-400 mb-1">エラーが発生しました</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ローディング表示 */}
        {loading && news.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-100 dark:border-indigo-900" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl animate-pulse">🧠</span>
              </div>
            </div>
            <p className="mt-6 text-slate-600 dark:text-slate-400 font-medium">
              最新のAIニュースを収集・分析中...
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
              図解を生成しています（10〜20秒）
            </p>
          </div>
        )}

        {/* ニュース一覧 */}
        {!loading && news.length > 0 && (
          <div className="space-y-8">
            {news.map((item, index) => (
              <div 
                key={index} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <NewsCard newsItem={item} index={index} />
              </div>
            ))}
          </div>
        )}

        {/* ニュースがない場合 */}
        {!loading && news.length === 0 && !error && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              ニュースが見つかりませんでした
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              しばらく後で再度お試しください
            </p>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Powered by <span className="font-semibold">Gemini AI</span> • Real-time RSS feeds
          </p>
        </div>
      </footer>
    </div>
  );
}

// ニュースカードコンポーネント
function NewsCard({ newsItem, index }: { newsItem: NewsItem; index: number }) {
  const gradients = [
    "from-indigo-500 via-purple-500 to-pink-500",
    "from-cyan-500 via-blue-500 to-indigo-500",
    "from-emerald-500 via-teal-500 to-cyan-500",
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <article className="glass-card overflow-hidden">
      {/* ヘッダー部分 - グラデーション */}
      <div className={`relative bg-gradient-to-r ${gradient} px-6 py-5 md:px-8 md:py-6`}>
        {/* 装飾パターン */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        
        <div className="relative flex flex-wrap items-center gap-3">
          {/* ソースバッジ */}
          <span className="badge-glass flex items-center gap-2">
            <span>📰</span>
            <span className="text-slate-700">{newsItem.source || "Tech News"}</span>
          </span>
          
          {/* 日付バッジ */}
          <span className="badge-glass flex items-center gap-2">
            <span>📅</span>
            <span className="text-slate-700">{newsItem.publishedAt || "最新"}</span>
          </span>
        </div>
      </div>

      {/* コンテンツ部分 */}
      <div className="p-6 md:p-8">
        {/* タイトル */}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-5 leading-tight">
          {newsItem.title}
        </h2>

        {/* 要約カード */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 md:p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
              <span className="text-lg">📝</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">要約</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {newsItem.summary}
              </p>
            </div>
          </div>
        </div>

        {/* 元記事リンク */}
        <a
          href={newsItem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity mb-8"
        >
          <span>🔗</span>
          <span>元記事を読む</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        {/* 図解セクション */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-lg">🎨</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              ビジュアル図解
            </h3>
          </div>
          
          {/* 図解コンテンツ - 常にライトモードで表示（コントラスト保証）*/}
          <div 
            className="visual-container bg-white rounded-2xl p-4 md:p-6 border border-slate-200 overflow-hidden text-slate-900"
            dangerouslySetInnerHTML={{ __html: newsItem.visualHtml }}
          />
        </div>
      </div>
    </article>
  );
}

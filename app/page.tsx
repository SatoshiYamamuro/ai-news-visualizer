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
        // APIから返されたエラーメッセージを使用
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            AI News Visualizer
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            最新のAIニュースを視覚的に理解しよう
          </p>
          <button
            onClick={fetchNews}
            disabled={loading}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "読み込み中..." : "最新ニュースを取得"}
          </button>
        </header>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
            <div className="font-semibold mb-2">エラーが発生しました</div>
            <div className="whitespace-pre-line text-sm">{error}</div>
          </div>
        )}

        {/* ローディング表示 */}
        {loading && news.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* ニュース一覧 */}
        {!loading && news.length > 0 && (
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
            {news.map((item, index) => (
              <NewsCard key={index} newsItem={item} />
            ))}
          </div>
        )}

        {/* ニュースがない場合 */}
        {!loading && news.length === 0 && !error && (
          <div className="text-center py-20 text-slate-600 dark:text-slate-400">
            ニュースが見つかりませんでした
          </div>
        )}
      </div>
    </div>
  );
}

// ニュースカードコンポーネント
function NewsCard({ newsItem }: { newsItem: NewsItem }) {
  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* ヘッダー部分 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* ソース */}
            <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
              📰 {newsItem.source || "不明"}
            </span>
            {/* 公開日 */}
            <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
              📅 {newsItem.publishedAt || "日付不明"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* タイトル */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
          {newsItem.title}
        </h2>

        {/* 要約 */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            📝 要約
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {newsItem.summary}
          </p>
        </div>

        {/* リンク */}
        <a
          href={newsItem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors mb-6"
        >
          🔗 元記事を読む
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>

        {/* 図解HTML */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            視覚的な図解
          </h3>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden"
            dangerouslySetInnerHTML={{ __html: newsItem.visualHtml }}
          />
        </div>
      </div>
    </article>
  );
}

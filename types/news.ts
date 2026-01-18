export interface NewsItem {
  title: string;
  publishedAt: string;
  source: string;
  summary: string;
  url: string;
  visualHtml: string;
}

export interface NewsResponse {
  news: NewsItem[];
}

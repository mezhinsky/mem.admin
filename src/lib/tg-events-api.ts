import { api } from "./api/client";

export interface ArticlePublishedEventDto {
  articleId: string;
  title: string;
  excerpt?: string;
  url: string;
  mediaUrls?: string[];
  tags: string[];
}

export interface ArticlePublishedEventResult {
  success: boolean;
  postId: string;
  deliveriesCreated: number;
}

const TG_WEBHOOK_SECRET = import.meta.env.VITE_TG_WEBHOOK_SECRET as
  | string
  | undefined;

export const tgEventsApi = {
  articlePublished: async (
    dto: ArticlePublishedEventDto,
  ): Promise<ArticlePublishedEventResult> => {
    return api.post<ArticlePublishedEventResult>(
      "/tg/events/article-published",
      dto,
      TG_WEBHOOK_SECRET
        ? { headers: { "x-webhook-secret": TG_WEBHOOK_SECRET } }
        : undefined,
    );
  },
};


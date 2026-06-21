type SeoImage = {
  alt?: string;
  height?: number;
  url: string;
  width?: number;
};

export type SeoInput = {
  description: string;
  images?: SeoImage[];
  path: string;
  title: string;
  type?: "article" | "website";
  twitterCard?: "summary" | "summary_large_image";
};

import { act, render } from "@testing-library/react";

import { BlogPostAnalytics } from "../BlogPostAnalytics";

const trackArticleEngagedRead = jest.fn();
const trackArticleScrollDepth = jest.fn();

jest.mock("@/lib/analytics", () => ({
  trackArticleEngagedRead: (...args: unknown[]) =>
    trackArticleEngagedRead(...args),
  trackArticleScrollDepth: (...args: unknown[]) =>
    trackArticleScrollDepth(...args),
}));

describe("BlogPostAnalytics", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    trackArticleEngagedRead.mockClear();
    trackArticleScrollDepth.mockClear();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("tracks article scroll thresholds once", () => {
    const { container } = render(
      <>
        <main>
          <article>Post body</article>
        </main>
        <BlogPostAnalytics slug="test-post" title="Test Post" />
      </>
    );
    const article = container.querySelector("article");

    expect(article).not.toBeNull();
    Object.defineProperties(article!, {
      offsetHeight: { configurable: true, value: 1000 },
      scrollHeight: { configurable: true, value: 1000 },
    });
    article!.getBoundingClientRect = jest.fn(() => ({
      bottom: 0,
      height: 1000,
      left: 0,
      right: 0,
      top: -100,
      width: 0,
      x: 0,
      y: -100,
      toJSON: () => ({}),
    }));

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(trackArticleScrollDepth).toHaveBeenCalledTimes(1);
    expect(trackArticleScrollDepth).toHaveBeenCalledWith({
      depth: 50,
      slug: "test-post",
      title: "Test Post",
    });
  });

  it("resets scroll tracking when navigating between posts", () => {
    const { container, rerender } = render(
      <>
        <main>
          <article>Post body</article>
        </main>
        <BlogPostAnalytics slug="first-post" title="First Post" />
      </>
    );
    const article = container.querySelector("article");

    expect(article).not.toBeNull();
    Object.defineProperties(article!, {
      offsetHeight: { configurable: true, value: 1000 },
      scrollHeight: { configurable: true, value: 1000 },
    });
    article!.getBoundingClientRect = jest.fn(() => ({
      bottom: 0,
      height: 1000,
      left: 0,
      right: 0,
      top: -100,
      width: 0,
      x: 0,
      y: -100,
      toJSON: () => ({}),
    }));

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(trackArticleScrollDepth).toHaveBeenCalledWith({
      depth: 50,
      slug: "first-post",
      title: "First Post",
    });

    rerender(
      <>
        <main>
          <article>Post body</article>
        </main>
        <BlogPostAnalytics slug="second-post" title="Second Post" />
      </>
    );
    const nextArticle = container.querySelector("article");

    expect(nextArticle).not.toBeNull();
    Object.defineProperties(nextArticle!, {
      offsetHeight: { configurable: true, value: 1000 },
      scrollHeight: { configurable: true, value: 1000 },
    });
    nextArticle!.getBoundingClientRect = jest.fn(() => ({
      bottom: 0,
      height: 1000,
      left: 0,
      right: 0,
      top: -100,
      width: 0,
      x: 0,
      y: -100,
      toJSON: () => ({}),
    }));

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(trackArticleScrollDepth).toHaveBeenCalledWith({
      depth: 50,
      slug: "second-post",
      title: "Second Post",
    });
  });

  it("tracks engaged reads after enough time and scroll depth", () => {
    const { container } = render(
      <>
        <main>
          <article>Post body</article>
        </main>
        <BlogPostAnalytics slug="test-post" title="Test Post" />
      </>
    );
    const article = container.querySelector("article");

    expect(article).not.toBeNull();
    Object.defineProperties(article!, {
      offsetHeight: { configurable: true, value: 1000 },
      scrollHeight: { configurable: true, value: 1000 },
    });
    article!.getBoundingClientRect = jest.fn(() => ({
      bottom: 0,
      height: 1000,
      left: 0,
      right: 0,
      top: -100,
      width: 0,
      x: 0,
      y: -100,
      toJSON: () => ({}),
    }));

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      jest.advanceTimersByTime(45_000);
    });

    expect(trackArticleEngagedRead).toHaveBeenCalledTimes(1);
    expect(trackArticleEngagedRead).toHaveBeenCalledWith({
      minimumSeconds: 45,
      scrollDepth: 60,
      slug: "test-post",
      title: "Test Post",
    });
  });
});

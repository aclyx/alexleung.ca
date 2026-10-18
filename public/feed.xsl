<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom" exclude-result-prefixes="atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>
          <xsl:value-of select="rss/channel/title" />
        </title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            font-family: ui-sans-serif, system-ui, sans-serif;
            background: #faf9f5;
            color: #202936;
            line-height: 1.6;
          }
          .container {
            width: 100%;
            max-width: 1120px;
            margin: 0 auto;
            padding: 0 20px;
          }
          nav {
            display: flex;
            min-height: 72px;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 0 12px;
            border-bottom: 1px solid #d3d5d5;
            padding: 8px 0;
            font-size: 14px;
          }
          nav a {
            display: inline-flex;
            min-height: 44px;
            align-items: center;
          }
          .wordmark {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 12px;
            color: #58616d;
            text-decoration: none;
          }
          .content {
            max-width: 768px;
            padding: 32px 0 64px;
          }
          h1 {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 42px;
            font-weight: 400;
            letter-spacing: -0.035em;
            line-height: 1.1;
          }
          h2 {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 24px;
            font-weight: 400;
            line-height: 1.3;
          }
          h2 a {
            display: flex;
            min-height: 44px;
            align-items: center;
          }
          p {
            margin: 8px 0 0;
          }
          a {
            color: #285296;
            text-decoration-color: #a4b4cf;
            text-underline-offset: 3px;
          }
          a:hover {
            color: #1d3d72;
            text-decoration-color: currentColor;
          }
          a:focus-visible, input:focus-visible {
            outline: 2px solid #285296;
            outline-offset: 4px;
            border-radius: 2px;
          }
          .description {
            max-width: 650px;
            margin-top: 16px;
            font-size: 18px;
            color: #58616d;
          }
          .subscribe {
            max-width: 650px;
            margin-top: 24px;
          }
          .subscribe p {
            color: #58616d;
            font-size: 14px;
          }
          label {
            display: block;
            margin-top: 16px;
            font-size: 14px;
            font-weight: 500;
          }
          input {
            width: 100%;
            min-height: 44px;
            margin-top: 8px;
            border: 1px solid #858c95;
            border-radius: 6px;
            padding: 8px 12px;
            background: #fff;
            color: #202936;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 14px;
          }
          ul {
            list-style: none;
            margin: 32px 0 0;
            padding: 0;
          }
          li {
            padding: 20px 0;
            border-top: 1px solid #d3d5d5;
          }
          .date {
            margin: 0 0 8px;
            color: #58616d;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 12px;
          }
          .excerpt {
            color: #58616d;
            font-size: 14px;
          }
          .tags {
            margin-top: 8px;
            color: #58616d;
            font-size: 12px;
          }
          @media (min-width: 640px) {
            .container {
              padding-right: 24px;
              padding-left: 24px;
            }
            nav {
              min-height: 82px;
            }
            .wordmark {
              font-size: 13px;
            }
          }
          @media (min-width: 768px) {
            .content {
              padding-top: 44px;
              padding-bottom: 96px;
            }
            h1 {
              font-size: 52px;
            }
            .description {
              font-size: 20px;
            }
            .subscribe p, .excerpt {
              font-size: 16px;
            }
            li {
              padding: 24px 0;
            }
          }
          @media (min-width: 1024px) {
            .container {
              padding-right: 32px;
              padding-left: 32px;
            }
          }
        </style>
      </head>
      <body>
        <header class="container">
          <nav aria-label="Feed navigation">
            <a href="/" class="wordmark">alexleung.ca</a>
            <a href="{rss/channel/link}">← Back to Writing</a>
          </nav>
        </header>
        <main id="main-content" class="container">
          <div class="content">
            <h1>
              <xsl:value-of select="rss/channel/title" />
            </h1>
            <p class="description">
              <xsl:value-of select="rss/channel/description" />
            </p>
            <section class="subscribe" aria-label="Subscribe by RSS">
              <p>Use a feed reader to follow new posts. Copy this address into your reader to subscribe.</p>
              <label for="feed-address">Feed address</label>
              <input id="feed-address" type="url" readonly="readonly" spellcheck="false" value="{rss/channel/atom:link[@rel='self']/@href}" />
            </section>
            <ul>
              <xsl:for-each select="rss/channel/item">
                <li>
                  <p class="date" title="{pubDate}">
                    <xsl:value-of select="substring(pubDate, 6, 11)" />
                  </p>
                  <h2>
                    <a href="{link}">
                      <xsl:value-of select="title" />
                    </a>
                  </h2>
                  <p class="excerpt">
                    <xsl:value-of select="description" />
                  </p>
                  <xsl:if test="category">
                    <p class="tags">
                      <xsl:for-each select="category">
                        <xsl:if test="position() &gt; 1"> · </xsl:if>
                        <xsl:value-of select="." />
                      </xsl:for-each>
                    </p>
                  </xsl:if>
                </li>
              </xsl:for-each>
            </ul>
          </div>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

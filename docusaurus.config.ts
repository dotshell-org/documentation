import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Dotshell Documentation',
  tagline: 'Be Evil',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://dotshell.eu',
  baseUrl: '/',

  organizationName: 'dotshell-org',
  projectName: 'documentation',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/dotshell-org/documentation/tree/main/',
        },
        blog: {
          showReadingTime: true,
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/dotshell-org/documentation/tree/main/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Dotshell Documentation',
      logo: {
        alt: 'Dotshell Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'librariesSidebar',
          position: 'left',
          label: 'Libraries',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apisSidebar',
          position: 'left',
          label: 'APIs',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://dotshell.eu',
          label: 'Website',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Libraries',
              to: '/docs/libraries',
            },
            {
              label: 'APIs',
              to: '/docs/apis',
            },
          ],
        },
        {
          title: 'Social',
          items: [
            {
              label: 'Instagram',
              href: 'https://www.instagram.com/dotshell.eu/'
            },
            {
              label: 'YouTube',
              href: 'https://www.youtube.com/@dotshell-eu'
            },
            {
              label: 'X',
              href: 'https://x.com/dotshelleu'
            },
            {
              label: 'Threads',
              href: 'https://www.threads.com/@dotshell.eu'
            }
          ]
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/dotshell-org',
            },
            {
              label: 'Website',
              href: 'https://dotshell.eu',
            }
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Dotshell — Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
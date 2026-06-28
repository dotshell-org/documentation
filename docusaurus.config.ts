import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Dotshell Documentation',
  tagline: 'Be Evil',
  favicon: 'img/logo.svg',

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
          routeBasePath: '/',
        },
        blog: false,
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
          href: 'https://github.com/dotshell-org',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          href: 'https://www.instagram.com/dotshell.eu/',
          position: 'right',
          className: 'header-instagram-link',
          'aria-label': 'Instagram',
        },

        {
          href: 'https://dotshell.eu',
          label: 'Website',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Copyright © ${new Date().getFullYear()} Dotshell`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
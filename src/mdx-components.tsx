import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-4xl font-black text-navy mt-8 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold text-navy mt-8 mb-4">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-bold text-navy mt-6 mb-3">{children}</h3>,
    p: ({ children }) => <p className="text-text-primary leading-relaxed mb-4">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-text-primary">{children}</ul>,
    li: ({ children }) => <li>{children}</li>,
    ...components,
  }
}

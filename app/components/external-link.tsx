import type { AnchorHTMLAttributes, ReactNode } from 'react'

export type ExternalLinkProps = {
	href: string
	children: ReactNode
} & AnchorHTMLAttributes<HTMLAnchorElement>

export function ExternalLink({ children, href, ...props }: ExternalLinkProps) {
	return (
		<a href={href} target="_blank" rel="noopener noreferrer" {...props}>
			{children}
		</a>
	)
}

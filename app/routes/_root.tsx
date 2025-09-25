import { Link, Outlet } from 'react-router'

export default function Root() {
	return (
		<div className="min-h-dvh">
			<header className="border-b">
				<nav className="mx-auto flex max-w-6xl gap-4 p-4">
					<Link to="/" className="font-semibold">
						Home
					</Link>
				</nav>
			</header>
			<Outlet />
		</div>
	)
}

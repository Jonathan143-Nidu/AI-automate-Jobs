export default function BatchLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="batch-layout-root">
            {children}
        </div>
    )
}

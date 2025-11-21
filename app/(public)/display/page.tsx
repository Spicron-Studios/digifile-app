export default async function DisplayPage(): Promise<React.JSX.Element> {
	return (
		<div className="w-full h-full">
			<h1 className="">This is an iframe</h1>
			<iframe
				src={
					process.env.NEXT_PUBLIC_FRAME_URL || "https://localhost:5713/frame"
				}
				title="Embedded frame content"
				className="w-full h-full"
				sandbox="allow-scripts allow-same-origin"
			/>
		</div>
	);
}

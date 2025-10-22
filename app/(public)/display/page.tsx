export default async function DisplayPage({}): Promise<React.JSX.Element> {
  return (
    <div className="w-full h-full">
      <h1 className="">This is a Iframe</h1>
      <iframe
        src="http://localhost:3000/frame"
        title="description"
        className="w-full h-full"
      ></iframe>
    </div>
  );
}

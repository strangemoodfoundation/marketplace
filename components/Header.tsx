export const Header = () => {
    return <div className="w-full flex flex-row justify-between content-center bg-black text-white p-3">
        <h1 className="my-auto ">Strangemood</h1>
        <div className="flex flex-row gap-3 my-auto">
            <p className="font-bold">Store</p>
            <p className="text-gray-400">Community</p>
            <p className="text-gray-400">Develop</p>
        </div>
        <div className="flex flex-row gap-3">
            <button>Sign In</button>
            <button className="bg-black border border-white text-white">Download</button>
        </div>
    </div>
}

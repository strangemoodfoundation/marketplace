export const StoreNav = () => {
    return <div className="max-w-lg flex flex-row content-center py-3 gap-5">
        <form>
            <input className="border-2 border-grey text-sm px-3 py-2 rounded-tl-md rounded-tr-3xl rounded-br-md rounded-bl-3xl" type="text" placeholder="Search"/>
        </form>
        <p className="font-bold my-auto">Discover</p>
        <p className="text-gray-600 my-auto">Browse</p>
    </div>
}

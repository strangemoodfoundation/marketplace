import Image from 'next/image'
// this component is pretty worthless but I'm just gonna move on lol
export const FeaturedGenres = () => {
    return <div> 
        <h2 className='text-2xl font-bold py-2'>Popular Genres</h2>
        <div className="flex flex-row w-full justify-between">
            <p className='font-bold my-auto'>&lt;</p>
            <button className="strange-shape-reverse bg-white border border-black text-black font-bold hover:bg-black hover:text-white">Action</button>
            <button className="strange-shape-reverse bg-white border border-black text-black font-bold hover:bg-black hover:text-white">Horror</button>
            <button className="strange-shape-reverse bg-white border border-black text-black font-bold hover:bg-black hover:text-white">Indie</button>
            <button className="strange-shape-reverse bg-white border border-black text-black font-bold hover:bg-black hover:text-white">Strategy</button>
            <p className='font-bold my-auto'>&gt;</p>
        </div>
    </div>
}

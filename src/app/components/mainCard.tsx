import React from 'react'

interface MainCardProps{
    location: string;
    items: any;
}

const MainCard: React.FC<MainCardProps> = ({location, items}) => {
  return (
    <div className="snap-center shrink-0 max-w-xs rounded-md bg-[#1e1e2e] pl-5 pr-5 pt-3 pb-3 flex flex-col">
        <h1 className="text-2xl text-[#F38BA8] mb-1">{location}</h1>
        <ul>
            {items.map((item:any, index:any) => (
            <li key={index}>
                <div className="">
                    <strong>{item.name}</strong> <br />
                    <p className=" text-sm text-[#9b9ea1]">{item.description}</p>
                </div>
            </li>
            ))}
        </ul>
    </div>
  )
}

export default MainCard
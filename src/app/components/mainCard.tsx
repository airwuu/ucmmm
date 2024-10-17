import React from 'react'

interface MainCardProps{
    location: string;
    items: any;
}

const MainCard: React.FC<MainCardProps> = ({location, items}) => {
  return (
    <div className="snap-center shrink-0 rounded-md bg-[#1e1e2e] pl-5 pt-3">
        <h1>{location}</h1>
        <ul>
            {items.map((item:any, index:any) => (
            <li key={index}>
                <div className=" max-w-xs">
                    <strong>{item.name}</strong> <br />
                    <p>{item.description}</p>
                </div>
            </li>
            ))}
        </ul>
    </div>
  )
}

export default MainCard
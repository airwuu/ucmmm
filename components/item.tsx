"use client";
import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
interface itemProps {
  name: any;
  reports: any;
  id: any;
}
const item: React.FC<itemProps> = ({ name, reports, id }) => {
  const getButtonStyle = () => {
    if (reports >= 2) {
      return "bg-red-500";
    } else if (reports === 1) {
      return "bg-orange-500";
    }
    return "bg-content4";
  };

  function report() {
    fetch(`https://ucmmmdb.ucmmm-ucm.workers.dev/item/${id}/missing`, {
      method: "POST",
    })
      .then((response) => response.json()) // if expecting a JSON response
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
      window.location.reload();
  }
  return (
    <Dropdown backdrop="blur">
      <DropdownTrigger>
        <Button
          variant="solid"
          size="sm"
          className={`text-md font-light max-w-[240px] ${getButtonStyle()}`}
          style={{ wordBreak: "break-all" }}
        >
          {name}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Static Actions"
        disabledKeys={["name", "reports", "id"]}
      >
        <DropdownItem key="name">
          <b>{name}</b>
        </DropdownItem>
        <DropdownItem key="id">id: {id}</DropdownItem>
        <DropdownItem key="reports">Reports: {reports}</DropdownItem>
        <DropdownItem
          key="delete"
          className="text-danger"
          color="danger"
          onClick={report}
        >
          Report Missing
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default item;

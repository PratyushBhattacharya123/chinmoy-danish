import React from "react";
import { modals } from "@mantine/modals";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOutIcon } from "lucide-react";

const LogoutModal = () => {
  const openLogoutModal = () => {
    modals.openContextModal({
      modal: "logoutModal",
      innerProps: {},
      centered: true,
      withCloseButton: true,
    });
  };

  return (
    <DropdownMenuItem className="mt-1 cursor-pointer" onClick={openLogoutModal}>
      <LogOutIcon />
      Log out
    </DropdownMenuItem>
  );
};

export default LogoutModal;

import ItemsModalContent from "@/components/bills/modals/ItemsModal/ItemsModalContent";
import SupplyModalContent from "@/components/bills/modals/SupplyModal/SupplyModalContent";
import DeleteModalContent from "@/components/common/modals/deleteModal/DeleteModalContent";
import LogoutModalContent from "@/components/common/modals/logoutModal/LogoutModalContent";
import EditPartyDetailsModalContent from "@/components/partyDetails/modals/EditPartyDetailsModal/EditPartyDetailsModalContent";
import EditProductModalContent from "@/components/products/modals/EditProductModal/EditProductModalContent";
import StockItemsModalContent from "@/components/stocks/modals/StockItemsModal/StockItemsModalContent";
import EditUserModalContent from "@/components/users/modals/EditUserModal/EditUserModalContent";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

function MantinesProvider({ children }: React.PropsWithChildren) {
  return (
    <MantineProvider defaultColorScheme="light" forceColorScheme="light">
      <ModalsProvider
        modals={{
          logoutModal: LogoutModalContent,
          deleteModal: DeleteModalContent,
          editPartyDetailsModal: EditPartyDetailsModalContent,
          editProductModal: EditProductModalContent,
          itemsModal: ItemsModalContent,
          supplyModal: SupplyModalContent,
          editUserModal: EditUserModalContent,
          stockItemsModal: StockItemsModalContent,
        }}
      >
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
}

export default MantinesProvider;

// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import {
//   AddOn,
//   EnrichedBillsResponse,
//   EnrichedItem,
//   PartyDetailsResponse,
// } from "@/@types/server/response";
// import {
//   capitalize,
//   convertToDateFormat,
//   convertToWords,
// } from "@/components/utils/helper";
// import Image from "next/image";

// interface GSTBillProps {
//   billData: EnrichedBillsResponse;
//   type: "invoices" | "proforma-invoices";
// }

// type LineItem =
//   | (EnrichedItem & { type: "product"; serialOffset: number })
//   | (AddOn & { type: "addon"; serialOffset: number });

// interface ItemBreakup {
//   price: number;
//   taxableValue: number;
//   discount: number;
//   discountedAmount: number;
//   discountAmountWithoutGST: number;
//   igst: number;
//   cgst: number;
//   sgst: number;
//   itemTotal: number;
// }

// const GSTBillTemplate: React.FC<GSTBillProps> = ({ billData, type }) => {
//   console.log({ billData });
//   const [partyDetails, setPartyDetails] = useState<PartyDetailsResponse>();
//   const [items, setItems] = useState<EnrichedItem[]>([]);
//   const [addOns, setAddOns] = useState<AddOn[]>([]);
//   const [isInterState, setIsInterState] = useState(false);

//   useEffect(() => {
//     if (billData && billData.items && billData.partyDetails) {
//       setItems(billData.items);
//       setPartyDetails(billData.partyDetails);
//       setIsInterState(billData.partyDetails.stateCode !== "18");
//       setAddOns(billData.addOns || []);
//     }
//   }, [billData]);

//   // Helper function to format currency
//   const formatCurrency = (num: number): string => {
//     return Number(num.toFixed(2)).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   // Combine items and add-ons for pagination
//   const allLineItems = useMemo((): LineItem[] => {
//     const regularItems: LineItem[] = items.map((item) => ({
//       ...item,
//       type: "product" as const,
//       serialOffset: 0,
//     }));

//     const addOnItems: LineItem[] = addOns.map((addOn) => ({
//       ...addOn,
//       type: "addon" as const,
//       serialOffset: items.length,
//     }));

//     return [...regularItems, ...addOnItems];
//   }, [items, addOns]);

//   console.log({ allLineItems });

//   // Calculate items per page - last page gets only 3 items for footer space
//   const calculateItemsPerPage = (
//     pageIndex: number,
//     totalPages: number,
//   ): number => {
//     const ITEMS_PER_PAGE = 8;
//     const ITEMS_ON_LAST_PAGE = 3;

//     if (pageIndex === totalPages - 1) {
//       return ITEMS_ON_LAST_PAGE;
//     }
//     return ITEMS_PER_PAGE;
//   };

//   // Calculate total pages considering last page has only 3 items
//   const calculateTotalPages = (itemsCount: number): number => {
//     const ITEMS_PER_PAGE = 8;
//     const ITEMS_ON_LAST_PAGE = 3;

//     if (itemsCount <= ITEMS_ON_LAST_PAGE) {
//       return 1;
//     }

//     const remainingItems = itemsCount - ITEMS_ON_LAST_PAGE;
//     const fullPages = Math.ceil(remainingItems / ITEMS_PER_PAGE);
//     return fullPages + 1;
//   };

//   // Get items for specific page
//   const getItemsForPage = (
//     pageIndex: number,
//     totalPages: number,
//   ): LineItem[] => {
//     let startIndex = 0;

//     for (let i = 0; i < pageIndex; i++) {
//       const itemsPerPage = calculateItemsPerPage(i, totalPages);
//       startIndex += itemsPerPage;
//     }

//     const itemsPerPage = calculateItemsPerPage(pageIndex, totalPages);
//     return allLineItems.slice(startIndex, startIndex + itemsPerPage);
//   };

//   // Calculate taxable amount and GST amounts
//   const { taxableAmount, gstAmount, addOnsTotal, totalDiscount } =
//     useMemo(() => {
//       if (items.length === 0 && addOns.length === 0) {
//         return {
//           taxableAmount: 0,
//           gstAmount: 0,
//           addOnsTotal: 0,
//           totalDiscount: 0,
//         };
//       }

//       let totalTaxable = 0;
//       let totalGST = 0;
//       let totalAddOns = 0;
//       let totalItemDiscount = 0;

//       // Calculate for regular items (with GST)
//       items.forEach((item) => {
//         const unitPrice = item.isSubUnit
//           ? (item.productDetails?.price || 0) /
//               (item.productDetails?.subUnit?.conversionRate || 1) || 0
//           : item.productDetails?.price || 0;
//         const quantity = item.quantity;
//         const discountPercentage = item.discountPercentage || 0;
//         const gstSlab = item.productDetails?.gstSlab || 18;

//         // Calculate base amount without GST
//         const baseAmount = unitPrice * quantity;

//         // Calculate discount amount
//         const discountAmount = (baseAmount * discountPercentage) / 100;

//         // Calculate amount after discount
//         const amountAfterDiscount = baseAmount - discountAmount;

//         // Calculate taxable value (GST exclusive amount)
//         const taxableValue = amountAfterDiscount / (1 + gstSlab / 100);

//         // Calculate GST amount
//         const gstValue = amountAfterDiscount - taxableValue;

//         totalTaxable += taxableValue;
//         totalGST += gstValue;
//         totalItemDiscount += discountAmount;
//       });

//       // Calculate for add-ons (without GST)
//       addOns.forEach((addOn) => {
//         totalAddOns += addOn.price;
//       });

//       return {
//         taxableAmount: totalTaxable,
//         gstAmount: totalGST,
//         addOnsTotal: totalAddOns,
//         totalDiscount: totalItemDiscount,
//       };
//     }, [items, addOns]);

//   // Calculate rounding difference and final total
//   const { roundingDifference, finalTotal } = useMemo(() => {
//     const totalBeforeRounding = taxableAmount + gstAmount + addOnsTotal;
//     const roundedTotal = Math.round(totalBeforeRounding);
//     const roundingDifference = roundedTotal - totalBeforeRounding;

//     return {
//       roundingDifference,
//       finalTotal: roundedTotal,
//     };
//   }, [taxableAmount, gstAmount, addOnsTotal]);

//   // Calculate grand total
//   const grandTotal = finalTotal;

//   // Calculate item total with GST separation
//   const calculateItemBreakup = (item: LineItem): ItemBreakup => {
//     if (item.type === "addon") {
//       // Add-ons don't have GST
//       return {
//         price: item.price,
//         taxableValue: 0,
//         discount: 0,
//         discountedAmount: 0,
//         discountAmountWithoutGST: 0,
//         igst: 0,
//         cgst: 0,
//         sgst: 0,
//         itemTotal: item.price,
//       };
//     }

//     // Regular product with GST
//     const unitPrice = item.isSubUnit
//       ? (item.productDetails?.price || 0) /
//           (item.productDetails?.subUnit?.conversionRate || 1) || 0
//       : item.productDetails?.price || 0;
//     const quantity = item.quantity;
//     const discountPercentage = item.discountPercentage || 0;
//     const gstSlab = item.productDetails?.gstSlab || 18;
//     const gstRate = gstSlab / 100;

//     // Calculate base amount
//     const baseAmount = unitPrice * quantity;

//     // Calculate discount amount
//     const discountAmount = (baseAmount * discountPercentage) / 100;

//     // Calculate discount amount
//     const discountAmountWithoutGST = discountAmount / (1 + gstRate);

//     // Calculate amount after discount
//     const amountAfterDiscount = baseAmount - discountAmount;

//     // Calculate taxable value (GST exclusive amount)
//     const taxableValue = amountAfterDiscount / (1 + gstRate);

//     // Calculate GST amount
//     const gstValue = amountAfterDiscount - taxableValue;

//     // Calculate unit price without GST for display
//     const priceWithoutGST = unitPrice / (1 + gstRate);

//     if (isInterState) {
//       return {
//         price: priceWithoutGST,
//         taxableValue: taxableValue,
//         discount: discountPercentage,
//         discountedAmount: discountAmount,
//         discountAmountWithoutGST,
//         igst: gstValue,
//         cgst: 0,
//         sgst: 0,
//         itemTotal: amountAfterDiscount,
//       };
//     } else {
//       return {
//         price: priceWithoutGST,
//         taxableValue: taxableValue,
//         discount: discountPercentage,
//         discountedAmount: discountAmount,
//         discountAmountWithoutGST: discountAmountWithoutGST,
//         igst: 0,
//         cgst: gstValue / 2,
//         sgst: gstValue / 2,
//         itemTotal: amountAfterDiscount,
//       };
//     }
//   };

//   const amountInWords = grandTotal
//     ? convertToWords(Math.round(grandTotal)) + " Rupees Only"
//     : "Zero Rupees Only";

//   const renderItemsTable = (
//     pageItems: LineItem[],
//     pageNumber: number,
//     totalPages: number,
//   ) => {
//     const itemsPerPage = calculateItemsPerPage(pageNumber - 1, totalPages);

//     return (
//       <div key={pageNumber} style={{ marginBottom: "16px" }}>
//         <table
//           style={{
//             width: "100%",
//             fontSize: "11px",
//             borderCollapse: "collapse",
//           }}
//         >
//           <thead>
//             <tr style={{ backgroundColor: "rgb(249, 250, 251)" }}>
//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   width: "40px",
//                 }}
//               >
//                 SI No.
//               </th>
//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   minWidth: "80px",
//                   textAlign: "center",
//                 }}
//               >
//                 Name of the Product
//               </th>
//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   width: "64px",
//                 }}
//               >
//                 HSN/ SAC
//               </th>
//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   width: "48px",
//                 }}
//               >
//                 UOM
//               </th>
//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   width: "48px",
//                 }}
//               >
//                 Qty
//               </th>
//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   width: "64px",
//                 }}
//               >
//                 Rate (₹)
//               </th>

//               {/* Discount Column */}
//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   width: "48px",
//                 }}
//               >
//                 Disc. (%)
//               </th>

//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   width: "64px",
//                 }}
//               >
//                 Disc. Amt (₹)
//               </th>

//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   width: "64px",
//                 }}
//               >
//                 Taxable Amt (₹)
//               </th>

//               {isInterState ? (
//                 <>
//                   <th
//                     style={{
//                       border: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       width: "48px",
//                     }}
//                   >
//                     IGST Rate (%)
//                   </th>
//                   <th
//                     style={{
//                       border: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       width: "64px",
//                     }}
//                   >
//                     IGST Amt (₹)
//                   </th>
//                 </>
//               ) : (
//                 <>
//                   <th
//                     style={{
//                       border: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       width: "48px",
//                     }}
//                   >
//                     CGST Rate (%)
//                   </th>
//                   <th
//                     style={{
//                       border: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       width: "64px",
//                     }}
//                   >
//                     CGST Amt (₹)
//                   </th>
//                   <th
//                     style={{
//                       border: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       width: "48px",
//                     }}
//                   >
//                     SGST Rate (%)
//                   </th>
//                   <th
//                     style={{
//                       border: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       width: "64px",
//                     }}
//                   >
//                     SGST Amount (₹)
//                   </th>
//                 </>
//               )}

//               <th
//                 style={{
//                   border: "1px solid rgb(209, 213, 219)",
//                   padding: "4px",
//                   width: "64px",
//                 }}
//               >
//                 Total (₹)
//               </th>
//             </tr>
//           </thead>
//           <tbody style={{ border: "1px solid rgb(209, 213, 219)" }}>
//             {pageItems.map((item, index) => {
//               const breakup = calculateItemBreakup(item);
//               let serialNo = index + 1;
//               for (let i = 0; i < pageNumber - 1; i++) {
//                 serialNo += calculateItemsPerPage(i, totalPages);
//               }

//               const isAddOn = item.type === "addon";
//               const gstRate = isInterState
//                 ? (item.type === "product"
//                     ? item.productDetails?.gstSlab
//                     : 18) || 18
//                 : ((item.type === "product"
//                     ? item.productDetails?.gstSlab
//                     : 18) || 18) / 2;

//               return (
//                 <tr
//                   key={index}
//                   style={{
//                     height: isAddOn ? "30px" : isInterState ? "45px" : "56px",
//                     fontSize: "11px",
//                   }}
//                 >
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "center",
//                     }}
//                   >
//                     {isAddOn ? "" : serialNo}
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     {isAddOn ? (
//                       <span style={{ fontStyle: "italic", color: "#666" }}>
//                         {item.title}
//                       </span>
//                     ) : (
//                       item.productDetails?.name || "Product Not Found"
//                     )}
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "center",
//                     }}
//                   >
//                     {isAddOn ? "" : item.productDetails?.hsnCode || "N/A"}
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "center",
//                     }}
//                   >
//                     {isAddOn
//                       ? ""
//                       : item.isSubUnit
//                         ? capitalize(
//                             item.productDetails?.subUnit?.unit || "pcs",
//                           )
//                         : capitalize(item.productDetails?.unit || "pcs")}
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "right",
//                     }}
//                   >
//                     {isAddOn ? "" : item.quantity}
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "right",
//                     }}
//                   >
//                     {isAddOn ? "" : formatCurrency(breakup.price)}
//                   </td>

//                   {/* Discount Percentage */}
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "center",
//                     }}
//                   >
//                     {isAddOn
//                       ? ""
//                       : breakup.discount > 0
//                         ? `${breakup.discount}%`
//                         : ""}
//                   </td>

//                   {/* Discount Amount */}
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "right",
//                     }}
//                   >
//                     {isAddOn
//                       ? ""
//                       : breakup.discountAmountWithoutGST
//                         ? formatCurrency(breakup.discountAmountWithoutGST)
//                         : ""}
//                   </td>

//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "right",
//                     }}
//                   >
//                     {isAddOn ? "" : formatCurrency(breakup.taxableValue)}
//                   </td>

//                   {isInterState ? (
//                     <>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                           textAlign: "center",
//                         }}
//                       >
//                         {isAddOn
//                           ? ""
//                           : `${
//                               item.type === "product"
//                                 ? item.productDetails?.gstSlab
//                                 : 18
//                             }%`}
//                       </td>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                           textAlign: "right",
//                         }}
//                       >
//                         {isAddOn ? "" : formatCurrency(breakup.igst)}
//                       </td>
//                     </>
//                   ) : (
//                     <>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                           textAlign: "center",
//                         }}
//                       >
//                         {isAddOn ? "" : `${gstRate}%`}
//                       </td>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                           textAlign: "right",
//                         }}
//                       >
//                         {isAddOn ? "" : formatCurrency(breakup.cgst)}
//                       </td>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                           textAlign: "center",
//                         }}
//                       >
//                         {isAddOn ? "" : `${gstRate}%`}
//                       </td>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                           textAlign: "right",
//                         }}
//                       >
//                         {isAddOn ? "" : formatCurrency(breakup.sgst)}
//                       </td>
//                     </>
//                   )}

//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "right",
//                       fontWeight: "500",
//                     }}
//                   >
//                     {formatCurrency(breakup.itemTotal)}
//                   </td>
//                 </tr>
//               );
//             })}

//             {/* Fill remaining rows for consistent layout */}
//             {Array.from({ length: itemsPerPage - pageItems.length }).map(
//               (_, index) => (
//                 <tr key={`empty-${index}`} style={{ height: "56px" }}>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                       textAlign: "center",
//                     }}
//                   >
//                     &nbsp;
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     &nbsp;
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     &nbsp;
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     &nbsp;
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     &nbsp;
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     &nbsp;
//                   </td>
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     &nbsp;
//                   </td>

//                   {isInterState ? (
//                     <>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                         }}
//                       >
//                         &nbsp;
//                       </td>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                         }}
//                       >
//                         &nbsp;
//                       </td>
//                     </>
//                   ) : (
//                     <>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                         }}
//                       >
//                         &nbsp;
//                       </td>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                         }}
//                       >
//                         &nbsp;
//                       </td>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                         }}
//                       >
//                         &nbsp;
//                       </td>
//                       <td
//                         style={{
//                           borderRight: "1px solid rgb(209, 213, 219)",
//                           padding: "4px",
//                         }}
//                       >
//                         &nbsp;
//                       </td>
//                     </>
//                   )}

//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     &nbsp;
//                   </td>

//                   {/* Empty discount columns */}
//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     &nbsp;
//                   </td>

//                   <td
//                     style={{
//                       borderRight: "1px solid rgb(209, 213, 219)",
//                       padding: "4px",
//                     }}
//                   >
//                     &nbsp;
//                   </td>
//                 </tr>
//               ),
//             )}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   // Show error state if no data
//   if (!billData) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           minHeight: "256px",
//         }}
//       >
//         <div style={{ textAlign: "center" }}>
//           <p style={{ color: "rgb(220, 38, 38)" }}>No bill data available</p>
//         </div>
//       </div>
//     );
//   }

//   const totalPages = calculateTotalPages(allLineItems.length);

//   return (
//     <div style={{ backgroundColor: "rgb(255, 255, 255)" }}>
//       {/* Multiple pages for items */}
//       {Array.from({ length: totalPages }).map((_, pageIndex) => {
//         const pageItems = getItemsForPage(pageIndex, totalPages);
//         const isLastPage = pageIndex === totalPages - 1;

//         return (
//           <div
//             key={pageIndex}
//             style={{
//               width: "210mm",
//               height: "297mm",
//               backgroundColor: "rgb(255, 255, 255)",
//               border: "1px solid rgb(229, 231, 235)",
//               boxShadow:
//                 "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
//               margin: "0 auto 16px auto",
//               padding: "30px 48px",
//               pageBreakAfter: isLastPage ? "auto" : "always",
//               position: "relative",
//             }}
//           >
//             <div className="absolute top-9 left-[72px] size-[72px]">
//               <Image
//                 src="/logo/logo.png"
//                 alt="Logo"
//                 className="object-cover rounded-full"
//                 height={500}
//                 width={500}
//               />
//             </div>
//             {/* Header Section */}
//             <div
//               style={{
//                 borderBottom: "2px solid rgb(31, 41, 55)",
//                 paddingBottom: "12px",
//                 marginBottom: "16px",
//               }}
//             >
//               <div style={{ textAlign: "center" }}>
//                 <h1
//                   style={{
//                     fontSize: "18px",
//                     fontWeight: "700",
//                     color: "rgb(17, 24, 39)",
//                     marginBottom: "4px",
//                   }}
//                 >
//                   CHINMOY DANISH ELECTRICAL PLUMBING SHOP
//                 </h1>
//                 <p
//                   style={{
//                     fontSize: "14px",
//                     color: "rgb(55, 65, 81)",
//                     lineHeight: "1.25",
//                     marginBottom: "8px",
//                   }}
//                 >
//                   Khagen Mahanta Road, Hengrabari
//                   <br />
//                   Near Kali Mandir, Kamrup (M)
//                   <br />
//                   Guwahati-781036, Assam
//                 </p>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     fontSize: "12px",
//                     color: "rgb(55, 65, 81)",
//                   }}
//                 >
//                   <span style={{ fontWeight: "600" }}>Phone : 60026-57792</span>
//                   <span style={{ fontWeight: "600" }}>
//                     GSTIN : 18AVDPT4124G1ZK
//                   </span>
//                 </div>
//               </div>

//               <div style={{ textAlign: "center", marginTop: "8px" }}>
//                 <h2 style={{ fontSize: "18px", fontWeight: "700" }}>
//                   {type === "invoices" ? "TAX INVOICE" : "PROFORMA INVOICE"}
//                 </h2>
//               </div>
//             </div>

//             {/* Bill To and Invoice Details */}
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "2fr 1fr",
//                 gap: "16px",
//                 marginBottom: "12px",
//               }}
//             >
//               <div>
//                 <h3
//                   style={{
//                     fontSize: "14px",
//                     fontWeight: "600",
//                     padding: "4px 0",
//                     marginBottom: "4px",
//                   }}
//                 >
//                   BILL TO
//                 </h3>
//                 <div
//                   style={{
//                     fontSize: "12px",
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "4px",
//                   }}
//                 >
//                   <p>
//                     <strong>Name :</strong> {partyDetails?.name}
//                   </p>
//                   <p style={{ wordWrap: "break-word" }}>
//                     <strong>Address :</strong> {partyDetails?.address}
//                   </p>
//                   {partyDetails?.gstNumber && (
//                     <p>
//                       <strong>GSTIN :</strong> {partyDetails?.gstNumber}
//                     </p>
//                   )}
//                   <div className="flex gap-4">
//                     <p>
//                       <strong>State :</strong> {partyDetails?.state}
//                     </p>
//                     <p>
//                       <strong>State Code :</strong> {partyDetails?.stateCode}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <table style={{ width: "100%", fontSize: "12px" }}>
//                   <tbody
//                     style={{
//                       display: "flex",
//                       flexDirection: "column",
//                       gap: "2px",
//                     }}
//                   >
//                     <tr>
//                       <td style={{ paddingRight: "8px" }}>
//                         <strong>Invoice No :</strong>
//                       </td>
//                       <td
//                         style={{ color: "rgb(220, 38, 38)", fontWeight: "500" }}
//                       >
//                         {billData?.billNumber}
//                       </td>
//                     </tr>
//                     <tr>
//                       <td style={{ paddingRight: "8px" }}>
//                         <strong>Invoice Date :</strong>
//                       </td>
//                       <td>
//                         {convertToDateFormat(String(billData?.invoiceDate))}
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Transportation Details */}
//             <div style={{ marginBottom: "16px" }}>
//               <h3
//                 style={{
//                   fontSize: "14px",
//                   fontWeight: "600",
//                   padding: "4px 0",
//                   marginBottom: "4px",
//                 }}
//               >
//                 TRANSPORTATION DETAILS
//               </h3>
//               <div style={{ fontSize: "12px" }}>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     marginBottom: "4px",
//                   }}
//                 >
//                   <span>
//                     <strong>Transporter Name :</strong>{" "}
//                     {billData?.supplyDetails.transporterName || ""}
//                   </span>
//                   <span>
//                     <strong>Vehicle No :</strong>{" "}
//                     {billData?.supplyDetails.vehicleNumber || (
//                       <span style={{ opacity: "0" }}>AS01MA5176</span>
//                     )}
//                   </span>
//                 </div>
//                 <div
//                   style={{ display: "flex", justifyContent: "space-between" }}
//                 >
//                   <span>
//                     <strong>Date of Supply :</strong>{" "}
//                     {billData?.supplyDetails.supplyDate
//                       ? convertToDateFormat(
//                           String(billData?.supplyDetails.supplyDate),
//                         )
//                       : ""}
//                   </span>
//                   <span>
//                     <strong>Place of Supply :</strong>{" "}
//                     {billData?.supplyDetails.supplyPlace}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Items Table */}
//             {renderItemsTable(pageItems, pageIndex + 1, totalPages)}

//             {/* Footer Section - Only show on last page */}
//             {isLastPage && (
//               <div style={{ marginTop: "24px" }}>
//                 <div
//                   style={{
//                     display: "grid",
//                     gridTemplateColumns: "1fr 1fr",
//                     gap: "16px",
//                     marginBottom: "16px",
//                   }}
//                 >
//                   <div
//                     style={{
//                       border: "1px solid rgb(209, 213, 219)",
//                       padding: "8px",
//                       fontSize: "12px",
//                     }}
//                   >
//                     <p>
//                       <strong>Total ₹ (in words) :</strong>
//                     </p>
//                     <p style={{ marginTop: "4px" }}>{amountInWords}</p>
//                   </div>

//                   <div>
//                     <table
//                       style={{
//                         width: "100%",
//                         fontSize: "12px",
//                         borderCollapse: "collapse",
//                         border: "1px solid rgb(209, 213, 219)",
//                       }}
//                     >
//                       <tbody>
//                         <tr>
//                           <td
//                             style={{
//                               border: "1px solid rgb(209, 213, 219)",
//                               padding: "4px",
//                             }}
//                           >
//                             Taxable Amount :
//                           </td>
//                           <td
//                             style={{
//                               border: "1px solid rgb(209, 213, 219)",
//                               padding: "4px",
//                               textAlign: "right",
//                             }}
//                           >
//                             ₹{formatCurrency(taxableAmount)}
//                           </td>
//                         </tr>
//                         {isInterState ? (
//                           <tr>
//                             <td
//                               style={{
//                                 border: "1px solid rgb(209, 213, 219)",
//                                 padding: "4px",
//                               }}
//                             >
//                               Add IGST :
//                             </td>
//                             <td
//                               style={{
//                                 border: "1px solid rgb(209, 213, 219)",
//                                 padding: "4px",
//                                 textAlign: "right",
//                               }}
//                             >
//                               ₹{formatCurrency(gstAmount)}
//                             </td>
//                           </tr>
//                         ) : (
//                           <>
//                             <tr>
//                               <td
//                                 style={{
//                                   border: "1px solid rgb(209, 213, 219)",
//                                   padding: "4px",
//                                 }}
//                               >
//                                 Add CGST :
//                               </td>
//                               <td
//                                 style={{
//                                   border: "1px solid rgb(209, 213, 219)",
//                                   padding: "4px",
//                                   textAlign: "right",
//                                 }}
//                               >
//                                 ₹{formatCurrency(gstAmount / 2)}
//                               </td>
//                             </tr>
//                             <tr>
//                               <td
//                                 style={{
//                                   border: "1px solid rgb(209, 213, 219)",
//                                   padding: "4px",
//                                 }}
//                               >
//                                 Add SGST :
//                               </td>
//                               <td
//                                 style={{
//                                   border: "1px solid rgb(209, 213, 219)",
//                                   padding: "4px",
//                                   textAlign: "right",
//                                 }}
//                               >
//                                 ₹{formatCurrency(gstAmount / 2)}
//                               </td>
//                             </tr>
//                           </>
//                         )}
//                         {addOnsTotal > 0 && (
//                           <tr>
//                             <td
//                               style={{
//                                 border: "1px solid rgb(209, 213, 219)",
//                                 padding: "4px",
//                               }}
//                             >
//                               Additional Charges :
//                             </td>
//                             <td
//                               style={{
//                                 border: "1px solid rgb(209, 213, 219)",
//                                 padding: "4px",
//                                 textAlign: "right",
//                               }}
//                             >
//                               ₹{formatCurrency(addOnsTotal)}
//                             </td>
//                           </tr>
//                         )}
//                         {/* Rounding Off Row - Only show if there's rounding difference */}
//                         {Math.abs(roundingDifference) > 0.001 && (
//                           <tr>
//                             <td
//                               style={{
//                                 border: "1px solid rgb(209, 213, 219)",
//                                 padding: "4px",
//                               }}
//                             >
//                               Rounding Off{" "}
//                               {roundingDifference > 0 ? "(+)" : "(-)"} :
//                             </td>
//                             <td
//                               style={{
//                                 border: "1px solid rgb(209, 213, 219)",
//                                 padding: "4px",
//                                 textAlign: "right",
//                               }}
//                             >
//                               ₹{formatCurrency(Math.abs(roundingDifference))}
//                             </td>
//                           </tr>
//                         )}
//                         {totalDiscount > 0 && (
//                           <tr>
//                             <td
//                               style={{
//                                 border: "1px solid rgb(209, 213, 219)",
//                                 padding: "4px",
//                               }}
//                             >
//                               Amount Saved :
//                             </td>
//                             <td
//                               style={{
//                                 border: "1px solid rgb(209, 213, 219)",
//                                 padding: "4px",
//                                 textAlign: "right",
//                               }}
//                               className="text-green-700 font-medium"
//                             >
//                               ₹{formatCurrency(totalDiscount)}
//                             </td>
//                           </tr>
//                         )}
//                         <tr style={{ backgroundColor: "rgb(249, 250, 251)" }}>
//                           <td
//                             style={{
//                               border: "1px solid rgb(209, 213, 219)",
//                               padding: "4px",
//                               fontWeight: "600",
//                             }}
//                           >
//                             Total Amount After Tax :
//                           </td>
//                           <td
//                             style={{
//                               border: "1px solid rgb(209, 213, 219)",
//                               padding: "4px",
//                               textAlign: "right",
//                               fontWeight: "600",
//                             }}
//                           >
//                             ₹{formatCurrency(grandTotal)}
//                           </td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>

//                 <div
//                   style={{
//                     display: "grid",
//                     gridTemplateColumns: "1fr 1fr",
//                     gap: "16px",
//                     marginBottom: "16px",
//                   }}
//                 >
//                   <div
//                     style={{
//                       border: "1px solid rgb(209, 213, 219)",
//                       padding: "8px",
//                       fontSize: "12px",
//                     }}
//                   >
//                     <p>
//                       <strong>Bank Details :</strong>
//                     </p>
//                     <p>Bank of Maharashtra</p>
//                     <p>Ganeshguri Branch</p>
//                     <p>Account No. : 60554701463</p>
//                     <p>IFSC Code : MAHB0001533</p>
//                   </div>

//                   <div
//                     style={{
//                       border: "1px solid rgb(209, 213, 219)",
//                       padding: "8px",
//                       fontSize: "12px",
//                       display: "flex",
//                       flexDirection: "column",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                     }}
//                   >
//                     <p>
//                       for{" "}
//                       <span style={{ fontWeight: "600" }}>
//                         Chinmoy Danish Electrical Plumbing Shop
//                       </span>
//                     </p>
//                     <p style={{ fontSize: "10px" }}>Authorised Signatory</p>
//                   </div>
//                 </div>

//                 <div
//                   style={{
//                     border: "1px solid rgb(209, 213, 219)",
//                     padding: "8px",
//                     fontSize: "11px",
//                   }}
//                 >
//                   <p>
//                     <strong>Declaration :</strong>
//                   </p>
//                   <div
//                     style={{
//                       marginTop: "4px",
//                       display: "flex",
//                       flexDirection: "column",
//                       gap: "4px",
//                     }}
//                   >
//                     <div>
//                       1. We declare that this invoice shows the actual price of
//                       the goods described and that all particulars are true and
//                       correct.
//                     </div>
//                     <div>
//                       2. Goods once sold will not be taken back or exchange.
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Page number */}
//             <div
//               style={{
//                 position: "absolute",
//                 bottom: "12px",
//                 right: "12px",
//                 fontSize: "12px",
//                 color: "rgb(107, 114, 128)",
//               }}
//             >
//               Page {pageIndex + 1} of {totalPages}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default GSTBillTemplate;

// "use client";

// import React, { useMemo } from "react";

// interface PartyDetails {
//   name: string;
//   address: string;
//   gstin?: string;
//   state: string;
//   stateCode: string;
// }

// export interface InvoiceItem {
//   id: string;
//   description: string;
//   hsn: string;
//   gstRate: number;
//   quantity: number;
//   unit: string;
//   rate: number;
//   discount?: number;
// }

// interface InvoiceData {
//   invoiceNo: string;
//   invoiceDate: string;
//   vehicleNo?: string;
//   transporterName?: string;
//   destination?: string;
//   buyer: PartyDetails;
//   consignee: PartyDetails;
//   items: InvoiceItem[];
// }

// interface Props {
//   data: InvoiceData;
//   type: "invoices" | "proforma-invoices";
// }

// const FIRST_PAGE_ITEMS = 18;
// const OTHER_PAGE_ITEMS = 24;

// const GSTInvoiceExact = ({ data, type }: Props) => {
//   const isInterState = data.buyer.stateCode !== "18";

//   const formatCurrency = (value: number) => {
//     return Number(value).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   const amountToWords = (amount: number) => {
//     return `${formatCurrency(amount)} Rupees Only`;
//   };

//   const processedItems = useMemo(() => {
//     return data.items.map((item) => {
//       const gross = item.quantity * item.rate;

//       const discountAmount = gross * ((item.discount || 0) / 100);

//       const taxableValue = gross - discountAmount;

//       const gstAmount = taxableValue * (item.gstRate / 100);

//       const cgst = isInterState ? 0 : gstAmount / 2;
//       const sgst = isInterState ? 0 : gstAmount / 2;
//       const igst = isInterState ? gstAmount : 0;

//       return {
//         ...item,
//         gross,
//         taxableValue,
//         gstAmount,
//         cgst,
//         sgst,
//         igst,
//         total: taxableValue + gstAmount,
//       };
//     });
//   }, [data.items, isInterState]);

//   const groupedGST = useMemo(() => {
//     const map = new Map();

//     processedItems.forEach((item) => {
//       const key = `${item.hsn}_${item.gstRate}`;

//       if (!map.has(key)) {
//         map.set(key, {
//           hsn: item.hsn,
//           gstRate: item.gstRate,
//           taxableValue: 0,
//           cgst: 0,
//           sgst: 0,
//           igst: 0,
//           totalTax: 0,
//         });
//       }

//       const existing = map.get(key);

//       existing.taxableValue += item.taxableValue;
//       existing.cgst += item.cgst;
//       existing.sgst += item.sgst;
//       existing.igst += item.igst;
//       existing.totalTax += item.gstAmount;
//     });

//     return Array.from(map.values());
//   }, [processedItems]);

//   const totals = useMemo(() => {
//     const taxable = processedItems.reduce(
//       (acc, item) => acc + item.taxableValue,
//       0,
//     );

//     const cgst = processedItems.reduce((acc, item) => acc + item.cgst, 0);

//     const sgst = processedItems.reduce((acc, item) => acc + item.sgst, 0);

//     const igst = processedItems.reduce((acc, item) => acc + item.igst, 0);

//     const total = taxable + cgst + sgst + igst;

//     const rounded = Math.round(total);

//     const roundOff = rounded - total;

//     return {
//       taxable,
//       cgst,
//       sgst,
//       igst,
//       total,
//       rounded,
//       roundOff,
//     };
//   }, [processedItems]);

//   const pages = useMemo(() => {
//     const result = [];

//     result.push(processedItems.slice(0, FIRST_PAGE_ITEMS));

//     let remaining = processedItems.slice(FIRST_PAGE_ITEMS);

//     while (remaining.length > 0) {
//       result.push(remaining.slice(0, OTHER_PAGE_ITEMS));

//       remaining = remaining.slice(OTHER_PAGE_ITEMS);
//     }

//     return result;
//   }, [processedItems]);

//   return (
//     <div>
//       {pages.map((pageItems, pageIndex) => {
//         const isLastPage = pageIndex === pages.length - 1;

//         return (
//           <div key={pageIndex} className="invoice-page">
//             <table className="main-table">
//               <tbody>
//                 <tr>
//                   <td colSpan={2} className="title-row">
//                     {type === "invoices" ? "TAX INVOICE" : "PROFORMA INVOICE"}
//                   </td>
//                 </tr>

//                 <tr>
//                   <td colSpan={2} className="company-section">
//                     <div className="company-name">
//                       CHINMOY DANISH ELECTRICAL PLUMBING SHOP
//                     </div>

//                     <div>Khagen Mahanta Road, Hengrabari</div>

//                     <div>Near Kali Mandir, Kamrup Metro</div>

//                     <div>Guwahati - 781036, Assam</div>

//                     <div>+91XXXXXXXXXX</div>

//                     <div>GSTIN/UIN: 18AVDPT4124G1ZK</div>

//                     <div>State Name : Assam, Code : 18</div>
//                   </td>
//                 </tr>

//                 <tr>
//                   <td className="party-box">
//                     <div className="party-heading">Consignee (Ship to)</div>

//                     <div className="party-name">{data.consignee.name}</div>

//                     <div className="pre-wrap">{data.consignee.address}</div>

//                     <div>GSTIN/UIN :{data.consignee.gstin}</div>

//                     <div>
//                       State Name :{data.consignee.state}, Code :
//                       {data.consignee.stateCode}
//                     </div>
//                   </td>

//                   <td className="party-box">
//                     <div className="party-heading">Buyer (Bill to)</div>

//                     <div className="party-name">{data.buyer.name}</div>

//                     <div className="pre-wrap">{data.buyer.address}</div>

//                     <div>GSTIN/UIN :{data.buyer.gstin}</div>

//                     <div>
//                       State Name :{data.buyer.state}, Code :
//                       {data.buyer.stateCode}
//                     </div>
//                   </td>
//                 </tr>

//                 <tr>
//                   <td colSpan={2}>
//                     <table className="meta-table">
//                       <tbody>
//                         <tr>
//                           <td>Invoice No.</td>
//                         </tr>

//                         <tr>
//                           <td>{data.invoiceNo}</td>
//                         </tr>

//                         <tr>
//                           <td>Dated</td>
//                           <td>Vehicle No.</td>
//                         </tr>

//                         <tr>
//                           <td>{data.invoiceDate}</td>

//                           <td>{data.vehicleNo || ""}</td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </td>
//                 </tr>

//                 <tr>
//                   <td colSpan={2}>
//                     <table className="items-table">
//                       <thead>
//                         <tr>
//                           <th className="sl-col">Sl</th>

//                           <th className="desc-col">Description of Goods</th>

//                           <th className="hsn-col">HSN/SAC</th>

//                           <th className="gst-col">GST Rate</th>

//                           <th className="qty-col">Quantity</th>

//                           <th className="rate-col">Rate</th>

//                           <th className="unit-col">Rate per</th>

//                           <th className="disc-col">Disc %</th>

//                           <th className="amt-col">Amount</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {pageItems.map((item, index) => (
//                           <tr key={item.id}>
//                             <td className="center align-top">{index + 1}</td>

//                             <td className="align-top pre-wrap">
//                               {item.description}
//                             </td>

//                             <td className="center align-top">{item.hsn}</td>
//                             <td className="center align-top">
//                               {item.gstRate}%
//                             </td>

//                             <td className="right align-top">{item.quantity}</td>

//                             <td className="right align-top">
//                               {formatCurrency(item.rate)}
//                             </td>

//                             <td className="center align-top">{item.unit}</td>

//                             <td className="center align-top">
//                               {item.discount || ""}
//                             </td>

//                             <td className="right align-top">
//                               {formatCurrency(item.taxableValue)}
//                             </td>
//                           </tr>
//                         ))}

//                         {Array.from({
//                           length:
//                             (pageIndex === 0
//                               ? FIRST_PAGE_ITEMS
//                               : OTHER_PAGE_ITEMS) - pageItems.length,
//                         }).map((_, index) => (
//                           <tr key={`empty-${index}`}>
//                             <td className="empty-row" />
//                             <td className="empty-row" />
//                             <td className="empty-row" />
//                             <td className="empty-row" />
//                             <td className="empty-row" />
//                             <td className="empty-row" />
//                             <td className="empty-row" />
//                             <td className="empty-row" />
//                             <td className="empty-row" />
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </td>
//                 </tr>

//                 {!isLastPage && (
//                   <tr>
//                     <td colSpan={2} className="continued">
//                       continued to page number {pageIndex + 2}
//                     </td>
//                   </tr>
//                 )}

//                 {isLastPage && (
//                   <>
//                     <tr>
//                       <td colSpan={2}>
//                         <table className="summary-table">
//                           <tbody>
//                             <tr>
//                               <td className="right">ROUND OFF</td>

//                               <td className="right">
//                                 {formatCurrency(totals.roundOff)}
//                               </td>
//                             </tr>

//                             <tr>
//                               <td className="right bold">Total ₹</td>

//                               <td className="right bold">
//                                 {formatCurrency(totals.rounded)}
//                               </td>
//                             </tr>
//                           </tbody>
//                         </table>
//                       </td>
//                     </tr>

//                     <tr>
//                       <td colSpan={2} className="words-section">
//                         Amount Chargeable (in words)
//                         <br />
//                         <strong>
//                           Indian Rupees {amountToWords(totals.rounded)}
//                         </strong>
//                       </td>
//                     </tr>

//                     <tr>
//                       <td colSpan={2}>
//                         <table className="gst-table">
//                           <thead>
//                             <tr>
//                               <th>HSN/SAC</th>

//                               <th>Taxable Value</th>

//                               {!isInterState ? (
//                                 <>
//                                   <th>CGST Rate</th>

//                                   <th>CGST Amount</th>

//                                   <th>SGST Rate</th>

//                                   <th>SGST Amount</th>
//                                 </>
//                               ) : (
//                                 <>
//                                   <th>IGST Rate</th>

//                                   <th>IGST Amount</th>
//                                 </>
//                               )}

//                               <th>Total Tax Amount</th>
//                             </tr>
//                           </thead>

//                           <tbody>
//                             {groupedGST.map((item, index) => (
//                               <tr key={index}>
//                                 <td>{item.hsn}</td>

//                                 <td className="right">
//                                   {formatCurrency(item.taxableValue)}
//                                 </td>

//                                 {!isInterState ? (
//                                   <>
//                                     <td className="center">
//                                       {item.gstRate / 2}%
//                                     </td>

//                                     <td className="right">
//                                       {formatCurrency(item.cgst)}
//                                     </td>

//                                     <td className="center">
//                                       {item.gstRate / 2}%
//                                     </td>

//                                     <td className="right">
//                                       {formatCurrency(item.sgst)}
//                                     </td>
//                                   </>
//                                 ) : (
//                                   <>
//                                     <td className="center">{item.gstRate}%</td>

//                                     <td className="right">
//                                       {formatCurrency(item.igst)}
//                                     </td>
//                                   </>
//                                 )}

//                                 <td className="right">
//                                   {formatCurrency(item.totalTax)}
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </td>
//                     </tr>
//                   </>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         );
//       })}

//       <style jsx global>{`
//         * {
//           box-sizing: border-box;
//         }

//         body {
//           margin: 0;
//           padding: 0;
//           background: white;
//           font-family: Arial, Helvetica, sans-serif;
//           color: black;
//         }

//         .invoice-page {
//           width: 210mm;
//           min-height: 297mm;
//           padding: 5mm;
//           background: white;
//           page-break-after: always;
//         }

//         table {
//           width: 100%;
//           border-collapse: collapse;
//           table-layout: fixed;
//         }

//         .main-table,
//         .main-table td,
//         .main-table th,
//         .items-table td,
//         .items-table th,
//         .meta-table td,
//         .summary-table td,
//         .gst-table td,
//         .gst-table th {
//           border: 1px solid black;
//         }

//         td,
//         th {
//           padding: 2px 4px;
//           font-size: 10px;
//           vertical-align: top;
//         }

//         .title-row {
//           text-align: center;
//           font-size: 18px;
//           font-weight: bold;
//         }

//         .top-left {
//           width: 80%;
//         }

//         .top-right {
//           width: 20%;
//           text-align: center;
//           vertical-align: middle;
//         }

//         .company-name {
//           font-size: 16px;
//           font-weight: bold;
//         }

//         .party-heading {
//           font-weight: bold;
//           margin-bottom: 4px;
//         }

//         .party-name {
//           font-weight: bold;
//         }

//         .sl-col {
//           width: 30px;
//         }

//         .desc-col {
//           width: 320px;
//         }

//         .hsn-col {
//           width: 80px;
//         }

//         .gst-col {
//           width: 60px;
//         }

//         .qty-col {
//           width: 70px;
//         }

//         .rate-col {
//           width: 70px;
//         }

//         .unit-col {
//           width: 60px;
//         }

//         .disc-col {
//           width: 50px;
//         }

//         .amt-col {
//           width: 100px;
//         }

//         .center {
//           text-align: center;
//         }

//         .right {
//           text-align: right;
//         }

//         .bold {
//           font-weight: bold;
//         }

//         .pre-wrap {
//           white-space: pre-wrap;
//           word-break: break-word;
//         }

//         .continued {
//           text-align: right;
//           padding: 4px;
//         }

//         .words-section {
//           padding: 6px;
//           line-height: 1.4;
//         }

//         .empty-row {
//           height: 22px;
//         }

//         .align-top {
//           vertical-align: top;
//         }

//         @media print {
//           body {
//             margin: 0;
//             padding: 0;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           .invoice-page {
//             margin: 0;
//             page-break-after: always;
//           }

//           table {
//             page-break-inside: auto;
//           }

//           tr {
//             page-break-inside: avoid;
//           }

//           thead {
//             display: table-header-group;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default GSTInvoiceExact;

// "use client";

// import React, { useMemo } from "react";
// import { convertToDateFormat, convertToWords } from "../utils/helper";

// interface Party {
//   name: string;
//   address: string;
//   gstin?: string;
//   state: string;
//   stateCode: string;
// }

// export interface InvoiceItem {
//   id: string;
//   description: string;
//   hsn: string;
//   gstRate: number;
//   quantity: number;
//   rate: number;
//   isSubUnit?: boolean;
//   unit?: string;
//   subUnit?: string;
//   conversionRate?: number;
//   discount?: number;
// }

// interface InvoiceData {
//   invoiceNo: string;
//   invoiceDate: string;
//   transporterName?: string;
//   dispatchedThrough?: string;
//   destination?: string;
//   buyer: Party;
//   items: InvoiceItem[];
// }

// interface Props {
//   data: InvoiceData;
//   type: "invoices" | "proforma-invoices";
// }

// const FIRST_PAGE_ITEMS = 14;
// const OTHER_PAGE_ITEMS = 18;

// const GSTInvoice = ({ data, type }: Props) => {
//   const isInterState = data.buyer.stateCode !== "18";

//   const formatCurrency = (value: number) => {
//     return Number(value).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   const processedItems = useMemo(() => {
//     return data.items.map((item, globalIndex) => {
//       /**
//        * RATE RECEIVED FROM PROPS IS GST INCLUSIVE
//        *
//        * First remove GST from rate
//        */

//       const gstMultiplier = 1 + item.gstRate / 100;

//       const baseRate = item.rate / gstMultiplier;

//       /**
//        * GROSS USING GST EXCLUSIVE RATE
//        */

//       const gross = item.isSubUnit
//         ? (item.quantity * baseRate) / (item?.conversionRate ?? 1)
//         : item.quantity * baseRate;

//       /**
//        * DISCOUNT
//        */

//       const discountAmount = gross * ((item.discount || 0) / 100);

//       /**
//        * TAXABLE VALUE
//        */

//       const taxableValue = gross - discountAmount;

//       /**
//        * GST AMOUNT
//        */

//       const gstAmount = taxableValue * (item.gstRate / 100);

//       /**
//        * GST SPLIT
//        */

//       const cgst = isInterState ? 0 : gstAmount / 2;

//       const sgst = isInterState ? 0 : gstAmount / 2;

//       const igst = isInterState ? gstAmount : 0;

//       return {
//         ...item,

//         serialNumber: globalIndex + 1,

//         /**
//          * GST EXCLUSIVE RATE
//          */
//         baseRate,

//         gross,

//         taxableValue,

//         discountAmount,

//         gstAmount,

//         cgst,

//         sgst,

//         igst,

//         total: taxableValue + gstAmount,
//       };
//     });
//   }, [data.items, isInterState]);

//   const groupedGST = useMemo(() => {
//     const map = new Map();

//     processedItems.forEach((item) => {
//       const key = `${item.hsn}_${item.gstRate}`;

//       if (!map.has(key)) {
//         map.set(key, {
//           hsn: item.hsn,
//           gstRate: item.gstRate,
//           taxableValue: 0,
//           cgst: 0,
//           sgst: 0,
//           igst: 0,
//           totalTax: 0,
//         });
//       }

//       const existing = map.get(key);

//       existing.taxableValue += item.taxableValue;

//       existing.cgst += item.cgst;
//       existing.sgst += item.sgst;
//       existing.igst += item.igst;

//       existing.totalTax += item.gstAmount;
//     });

//     return Array.from(map.values());
//   }, [processedItems]);

//   const totals = useMemo(() => {
//     const taxable = processedItems.reduce(
//       (acc, item) => acc + item.taxableValue,
//       0,
//     );

//     const cgst = processedItems.reduce((acc, item) => acc + item.cgst, 0);

//     const sgst = processedItems.reduce((acc, item) => acc + item.sgst, 0);

//     const igst = processedItems.reduce((acc, item) => acc + item.igst, 0);

//     const gstAmount = processedItems.reduce(
//       (acc, item) => acc + item.gstAmount,
//       0,
//     );

//     const total = taxable + gstAmount;

//     const rounded = Math.round(total);

//     const roundOff = rounded - total;

//     return {
//       taxable,
//       cgst,
//       sgst,
//       igst,
//       gstAmount,
//       total,
//       rounded,
//       roundOff,
//     };
//   }, [processedItems]);

//   const pages = useMemo(() => {
//     const result = [];

//     result.push(processedItems.slice(0, FIRST_PAGE_ITEMS));

//     let remaining = processedItems.slice(FIRST_PAGE_ITEMS);

//     while (remaining.length > 0) {
//       result.push(remaining.slice(0, OTHER_PAGE_ITEMS));

//       remaining = remaining.slice(OTHER_PAGE_ITEMS);
//     }

//     return result;
//   }, [processedItems]);

//   return (
//     <div>
//       {pages.map((pageItems, pageIndex) => {
//         const isLastPage = pageIndex === pages.length - 1;

//         return (
//           <div key={pageIndex} className="invoice-page">
//             <table className="main-table">
//               <tbody>
//                 <tr>
//                   <td colSpan={2} className="invoice-title uppercase">
//                     {type === "invoices" ? "Tax Invoice" : "Proforma Invoice"}
//                   </td>
//                 </tr>

//                 <tr>
//                   <td className="company-block">
//                     <div className="company-name">
//                       CHINMOY DANISH ELECTRICAL PLUMBING SHOP
//                     </div>

//                     <div>Khagen Mahanta Road, Hengrabari</div>

//                     <div>Near Kali Mandir, Kamrup Metro</div>

//                     <div>Guwahati - 781036, Assam</div>

//                     <div>GSTIN/UIN: 18AVDPT4124G1ZK</div>

//                     <div>State Name : Assam, Code : 18</div>

//                     <div>Contact : 6002657792</div>
//                   </td>

//                   <div className="w-full p-1 text-[10px]">
//                     <div className="meta-grid">
//                       <div className="meta-label">Invoice No.</div>
//                       <span>:</span>
//                       <div className="meta-value">{data.invoiceNo}</div>

//                       <div className="meta-label">Dated</div>
//                       <span>:</span>
//                       <div className="meta-value">
//                         {convertToDateFormat(data.invoiceDate)}
//                       </div>

//                       <div className="meta-label">Transporter Name</div>
//                       <span>:</span>
//                       <div className="meta-value">{data.transporterName}</div>

//                       <div className="meta-label">Vehicle Number</div>
//                       <span>:</span>
//                       <div className="meta-value">{data.dispatchedThrough}</div>

//                       <div className="meta-label">Destination</div>
//                       <span>:</span>
//                       <div className="meta-value">{data.destination}</div>
//                     </div>
//                   </div>
//                 </tr>

//                 <tr>
//                   <td colSpan={2} className="buyer-section">
//                     <div className="buyer-title">Buyer (Bill to)</div>

//                     <div className="buyer-name">{data.buyer.name}</div>

//                     <div className="pre-wrap">{data.buyer.address}</div>

//                     <div>GSTIN/UIN :{data.buyer.gstin}</div>

//                     <div>
//                       State Name :{data.buyer.state}, Code :
//                       {data.buyer.stateCode}
//                     </div>
//                   </td>
//                 </tr>

//                 <tr>
//                   <td colSpan={2}>
//                     <table className="items-table">
//                       <thead>
//                         <tr>
//                           <th className="sl-col">Sl</th>

//                           <th className="desc-col">Description of Goods</th>

//                           <th className="hsn-col">HSN/SAC</th>

//                           <th className="qty-col">Qty</th>

//                           <th className="rate-col">Rate</th>

//                           <th className="unit-col">per</th>

//                           <th className="disc-col">Disc %</th>

//                           <th className="amt-col">Amount</th>
//                         </tr>
//                       </thead>

//                       <tbody>
//                         {pageItems.map((item) => (
//                           <tr key={item.id}>
//                             <td className="center">{item.serialNumber}</td>

//                             <td className="pre-wrap">{item.description}</td>

//                             <td className="center">{item.hsn}</td>

//                             <td className="center">{item.quantity}</td>

//                             <td className="right">
//                               {formatCurrency(item.baseRate)}
//                             </td>

//                             <td className="center">
//                               {item.isSubUnit ? item.subUnit : item.unit}
//                             </td>

//                             <td className="center">{item.discount || ""}</td>

//                             <td className="right">
//                               {formatCurrency(item.taxableValue)}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </td>
//                 </tr>

//                 {isLastPage && (
//                   <>
//                     <tr>
//                       <td colSpan={2}>
//                         <table className="totals-table">
//                           <tbody>
//                             <tr>
//                               <td className="right">Subtotal</td>

//                               <td className="right">
//                                 {formatCurrency(totals.taxable)}
//                               </td>
//                             </tr>

//                             {!isInterState ? (
//                               <>
//                                 <tr>
//                                   <td className="right">CGST</td>

//                                   <td className="right">
//                                     {formatCurrency(totals.cgst)}
//                                   </td>
//                                 </tr>

//                                 <tr>
//                                   <td className="right">SGST</td>

//                                   <td className="right">
//                                     {formatCurrency(totals.sgst)}
//                                   </td>
//                                 </tr>
//                               </>
//                             ) : (
//                               <tr>
//                                 <td className="right">IGST</td>

//                                 <td className="right">
//                                   {formatCurrency(totals.igst)}
//                                 </td>
//                               </tr>
//                             )}

//                             <tr>
//                               <td className="right">Round Off</td>

//                               <td className="right">
//                                 {formatCurrency(totals.roundOff)}
//                               </td>
//                             </tr>

//                             <tr className="bold">
//                               <td className="right">Total</td>

//                               <td className="right">
//                                 ₹{formatCurrency(totals.rounded)}
//                               </td>
//                             </tr>
//                           </tbody>
//                         </table>
//                       </td>
//                     </tr>

//                     <tr>
//                       <td colSpan={2} className="words-section">
//                         <div>Amount Chargeable (in words)</div>

//                         <div className="bold">
//                           INR {convertToWords(totals.rounded)} Only
//                         </div>

//                         <div>E. & O.E</div>
//                       </td>
//                     </tr>

//                     <tr>
//                       <td colSpan={2}>
//                         <table className="gst-table">
//                           <thead>
//                             <tr>
//                               <th>HSN/SAC</th>

//                               <th>Taxable Value</th>

//                               {!isInterState ? (
//                                 <>
//                                   <th>CGST Rate</th>

//                                   <th>CGST Amount</th>

//                                   <th>SGST Rate</th>

//                                   <th>SGST Amount</th>
//                                 </>
//                               ) : (
//                                 <>
//                                   <th>IGST Rate</th>

//                                   <th>IGST Amount</th>
//                                 </>
//                               )}

//                               <th>Total Tax Amount</th>
//                             </tr>
//                           </thead>

//                           <tbody>
//                             {groupedGST.map((item, index) => (
//                               <tr key={index}>
//                                 <td>{item.hsn}</td>

//                                 <td className="right">
//                                   {formatCurrency(item.taxableValue)}
//                                 </td>

//                                 {!isInterState ? (
//                                   <>
//                                     <td className="center">
//                                       {item.gstRate / 2}%
//                                     </td>

//                                     <td className="right">
//                                       {formatCurrency(item.cgst)}
//                                     </td>

//                                     <td className="center">
//                                       {item.gstRate / 2}%
//                                     </td>

//                                     <td className="right">
//                                       {formatCurrency(item.sgst)}
//                                     </td>
//                                   </>
//                                 ) : (
//                                   <>
//                                     <td className="center">{item.gstRate}%</td>

//                                     <td className="right">
//                                       {formatCurrency(item.igst)}
//                                     </td>
//                                   </>
//                                 )}

//                                 <td className="right">
//                                   {formatCurrency(item.totalTax)}
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </td>
//                     </tr>

//                     <tr>
//                       <td className="declaration-section">
//                         <div>
//                           Tax Amount (in words) : INR{" "}
//                           {convertToWords(Number(totals.gstAmount.toFixed(2)))}{" "}
//                           Only
//                         </div>

//                         <div className="mt-8">Company’s PAN : AVDPT4124G</div>

//                         <div className="mt-8 bold">Declaration</div>

//                         <div className="mt-4">
//                           1) interest @24% will be charged if not paid within 15
//                           days of presentation.
//                         </div>

//                         <div>2) goods once sold will not be taken back</div>

//                         <div className="mt-8 bold">Company’s Bank Details</div>

//                         <div>Bank Name : Bank of Maharashtra</div>

//                         <div>A/c No. : 60554701463</div>

//                         <div>Branch & IFSC Code : Ganeshguri & MAHB0001533</div>
//                       </td>

//                       <td className="signature-section">
//                         <div>Customer’s Seal and Signature</div>

//                         <div className="company-sign">
//                           for CHINMOY DANISH ELECTRICAL PLUMBING SHOP
//                         </div>

//                         <div className="auth-sign">Authorised Signatory</div>
//                       </td>
//                     </tr>

//                     <tr>
//                       <td colSpan={2} className="footer">
//                         SUBJECT TO GUWAHATI JURISDICTION
//                         <br />
//                         This is a Computer Generated Invoice
//                       </td>
//                     </tr>
//                   </>
//                 )}
//               </tbody>
//             </table>

//             <div className="page-number">
//               Page {pageIndex + 1} of {pages.length}
//             </div>
//           </div>
//         );
//       })}

//       <style jsx global>{`
//         * {
//           box-sizing: border-box;
//         }

//         body {
//           margin: 0;
//           padding: 0;
//           background: white;
//           font-family: Arial, Helvetica, sans-serif;
//           color: black;
//         }

//         .invoice-page {
//           width: 210mm;
//           min-height: 297mm;
//           padding: 5mm;
//           background: white;
//           page-break-after: always;
//         }

//         table {
//           width: 100%;
//           border-collapse: collapse;
//           table-layout: fixed;
//         }

//         .main-table,
//         .main-table td,
//         .main-table th,
//         .items-table td,
//         .items-table th,
//         .gst-table td,
//         .gst-table th,
//         .totals-table td,
//         .meta-table td {
//           border: 1px solid black;
//         }

//         td,
//         th {
//           padding: 2px 4px;
//           font-size: 10px;
//           vertical-align: top;
//         }

//         .invoice-title {
//           text-align: center;
//           font-size: 18px;
//           font-weight: bold;
//         }

//         .company-name {
//           font-size: 12px;
//           font-weight: bold;
//         }

//         .buyer-title,
//         .bold {
//           font-weight: bold;
//         }

//         .pre-wrap {
//           white-space: pre-wrap;
//           word-break: break-word;
//         }

//         .center {
//           text-align: center;
//         }

//         .right {
//           text-align: right;
//         }

//         .mt-4 {
//           margin-top: 4px;
//         }

//         .mt-8 {
//           margin-top: 8px;
//         }

//         .signature-section {
//           vertical-align: bottom;
//         }

//         .company-sign {
//           margin-top: 60px;
//           font-weight: bold;
//           text-align: right;
//         }

//         .auth-sign {
//           margin-top: 40px;
//           text-align: right;
//         }

//         .footer {
//           text-align: center;
//           font-size: 10px;
//         }

//         .page-number {
//           text-align: right;
//           font-size: 10px;
//           margin-top: 4px;
//         }

//         .meta-grid {
//           display: grid;
//           grid-template-columns: auto auto 1fr;
//           gap: 0.25rem 0.5rem;
//           align-items: baseline;
//         }

//         .meta-value {
//           color: #1a202c;
//           word-break: break-word;
//         }

//         @media print {
//           body {
//             margin: 0;
//             padding: 0;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           .invoice-page {
//             margin: 0;
//             page-break-after: always;
//           }

//           table {
//             page-break-inside: auto;
//           }

//           tr {
//             page-break-inside: avoid;
//           }

//           thead {
//             display: table-header-group;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default GSTInvoice;

// "use client";

// import React, { useMemo } from "react";
// import { convertToDateFormat, convertToWords } from "../utils/helper";
// import { AddOn } from "@/@types/server/response";

// interface Party {
//   name: string;
//   address: string;
//   gstin?: string;
//   state: string;
//   stateCode: string;
// }

// export interface InvoiceItem {
//   id: string;
//   description: string;
//   hsn: string;
//   gstRate: number;
//   quantity: number;
//   rate: number;

//   isSubUnit?: boolean;
//   unit?: string;
//   subUnit?: string;
//   conversionRate?: number;

//   discount?: number;
// }

// interface InvoiceData {
//   invoiceNo: string;
//   invoiceDate: string;

//   transporterName?: string;
//   dispatchedThrough?: string;
//   destination?: string;

//   buyer: Party;

//   items: InvoiceItem[];

//   addOns?: AddOn[];
// }

// interface Props {
//   data: InvoiceData;
//   type: "invoices" | "proforma-invoices";
// }

// const OTHER_PAGE_ITEMS = 24;
// const LAST_PAGE_ITEMS = 18;

// const GSTInvoice = ({ data, type }: Props) => {
//   const isInterState = data.buyer.stateCode !== "18";

//   const formatCurrency = (value: number) => {
//     return Number(value).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   const processedItems = useMemo(() => {
//     return data.items.map((item, globalIndex) => {
//       /**
//        * GST Inclusive Rate
//        * Convert to Base Rate
//        */

//       const gstMultiplier = 1 + item.gstRate / 100;

//       const baseRate = item.rate / gstMultiplier;

//       /**
//        * Gross
//        */

//       const gross = item.isSubUnit
//         ? (item.quantity * baseRate) / (item?.conversionRate ?? 1)
//         : item.quantity * baseRate;

//       /**
//        * Discount
//        */

//       const discountAmount = gross * ((item.discount || 0) / 100);

//       /**
//        * Taxable
//        */

//       const taxableValue = gross - discountAmount;

//       /**
//        * GST
//        */

//       const gstAmount = taxableValue * (item.gstRate / 100);

//       const cgst = isInterState ? 0 : gstAmount / 2;

//       const sgst = isInterState ? 0 : gstAmount / 2;

//       const igst = isInterState ? gstAmount : 0;

//       return {
//         ...item,

//         serialNumber: globalIndex + 1,

//         baseRate,

//         gross,

//         taxableValue,

//         discountAmount,

//         gstAmount,

//         cgst,

//         sgst,

//         igst,

//         total: taxableValue + gstAmount,
//       };
//     });
//   }, [data.items, isInterState]);

//   /**
//    * Group GST
//    */

//   const groupedGST = useMemo(() => {
//     const map = new Map();

//     processedItems.forEach((item) => {
//       const key = `${item.hsn}_${item.gstRate}`;

//       if (!map.has(key)) {
//         map.set(key, {
//           hsn: item.hsn,

//           gstRate: item.gstRate,

//           taxableValue: 0,

//           cgst: 0,

//           sgst: 0,

//           igst: 0,

//           totalTax: 0,
//         });
//       }

//       const existing = map.get(key);

//       existing.taxableValue += item.taxableValue;

//       existing.cgst += item.cgst;

//       existing.sgst += item.sgst;

//       existing.igst += item.igst;

//       existing.totalTax += item.gstAmount;
//     });

//     return Array.from(map.values());
//   }, [processedItems]);

//   /**
//    * Totals
//    */

//   const totals = useMemo(() => {
//     const taxable = processedItems.reduce(
//       (acc, item) => acc + item.taxableValue,
//       0,
//     );

//     const cgst = processedItems.reduce((acc, item) => acc + item.cgst, 0);

//     const sgst = processedItems.reduce((acc, item) => acc + item.sgst, 0);

//     const igst = processedItems.reduce((acc, item) => acc + item.igst, 0);

//     const gstAmount = processedItems.reduce(
//       (acc, item) => acc + item.gstAmount,
//       0,
//     );

//     const totalQuantity = processedItems.reduce(
//       (acc, item) => acc + item.quantity,
//       0,
//     );

//     const total = taxable + gstAmount;

//     const rounded = Math.round(total);

//     const roundOff = rounded - total;

//     return {
//       taxable,

//       cgst,

//       sgst,

//       igst,

//       gstAmount,

//       totalQuantity,

//       total,

//       rounded,

//       roundOff,
//     };
//   }, [processedItems]);

//   /**
//    * Pagination
//    */

//   const pages = useMemo(() => {
//     const result = [];

//     result.push(processedItems.slice(0, OTHER_PAGE_ITEMS));

//     let remaining = processedItems.slice(OTHER_PAGE_ITEMS);

//     while (remaining.length > 0) {
//       result.push(remaining.slice(0, LAST_PAGE_ITEMS));

//       remaining = remaining.slice(LAST_PAGE_ITEMS);
//     }

//     return result;
//   }, [processedItems]);

//   return (
//     <div>
//       {pages.map((pageItems, pageIndex) => {
//         const isLastPage = pageIndex === pages.length - 1;

//         return (
//           <div key={pageIndex} className="invoice-page">
//             <div className="invoice-title p-1 !text-sm">
//               {type === "invoices" ? "Tax Invoice" : "Proforma Invoice"}
//             </div>
//             <table className="main-table">
//               <tbody>
//                 <tr>
//                   <td className="company-block border-r border-black p-1">
//                     <div className="company-name">
//                       CHINMOY DANISH ELECTRICAL PLUMBING SHOP
//                     </div>

//                     <div>
//                       Khagen Mahanta Road, Hengrabari, Near Kali Mandir, Kamrup
//                       Metro
//                     </div>

//                     <div>Guwahati - 781036, Assam</div>

//                     <div>GSTIN/UIN: 18AVDPT4124G1ZK</div>

//                     <div>State Name : Assam, Code : 18</div>

//                     <div>Contact : 60026-57792</div>
//                   </td>

//                   <td className="p-1 text-[10px] align-top">
//                     <div className="meta-grid">
//                       <div className="meta-label">Invoice No.</div>

//                       <span>:</span>

//                       <div className="meta-value">{data.invoiceNo}</div>

//                       <div className="meta-label">Dated</div>

//                       <span>:</span>

//                       <div className="meta-value">
//                         {convertToDateFormat(data.invoiceDate)}
//                       </div>

//                       <div className="meta-label">Transporter Name</div>

//                       <span>:</span>

//                       <div className="meta-value">{data.transporterName}</div>

//                       <div className="meta-label">Vehicle Number</div>

//                       <span>:</span>

//                       <div className="meta-value">{data.dispatchedThrough}</div>

//                       <div className="meta-label">Destination</div>

//                       <span>:</span>

//                       <div className="meta-value">{data.destination}</div>
//                     </div>
//                   </td>
//                 </tr>

//                 <tr>
//                   <td colSpan={2} className="buyer-section p-1">
//                     <div className="buyer-title">Buyer (Bill to)</div>

//                     <div className="buyer-name">Name :{data.buyer.name}</div>

//                     <div className="pre-wrap">
//                       Address : {data.buyer.address}
//                     </div>

//                     <div>GSTIN/UIN : {data.buyer.gstin}</div>

//                     <div>
//                       State Name : {data.buyer.state}, Code :
//                       {data.buyer.stateCode}
//                     </div>
//                   </td>
//                 </tr>

//                 <tr>
//                   <td colSpan={2}>
//                     <table className="items-table">
//                       <thead>
//                         <tr>
//                           <th className="sl-col p-1">Sl</th>

//                           <th className="desc-col p-1">Description of Goods</th>

//                           <th className="hsn-col p-1">HSN/SAC</th>

//                           <th className="qty-col p-1">Qty</th>

//                           <th className="rate-col p-1">Rate (₹)</th>

//                           <th className="unit-col p-1">UOM</th>

//                           <th className="disc-col p-1">Disc (%)</th>

//                           <th className="amt-col p-1">Amount (₹)</th>
//                         </tr>
//                       </thead>

//                       <tbody>
//                         {pageItems.map((item) => (
//                           <tr key={item.id}>
//                             <td className="center p-1">{item.serialNumber}</td>

//                             <td className="pre-wrap p-1">{item.description}</td>

//                             <td className="center p-1">{item.hsn}</td>

//                             <td className="center p-1">{item.quantity}</td>

//                             <td className="right p-1">
//                               {formatCurrency(item.baseRate)}
//                             </td>

//                             <td className="center p-1">
//                               {item.isSubUnit ? item.subUnit : item.unit}
//                             </td>

//                             <td className="center p-1">
//                               {item.discount || ""}
//                             </td>

//                             <td className="right p-1">
//                               {formatCurrency(item.taxableValue)}
//                             </td>
//                           </tr>
//                         ))}

//                         {isLastPage && (
//                           <>
//                             <tr>
//                               <td />

//                               <td />

//                               <td />

//                               <td />

//                               <td />

//                               <td />

//                               <td />

//                               <td className="!pt-3 flex items-center justify-center">
//                                 <div className="!w-[90%] !h-[0.5px] !bg-black" />
//                               </td>
//                             </tr>
//                             <tr>
//                               <td className="center p-1" />

//                               <td className="pre-wrap p-1" />

//                               <td className="center p-1" />

//                               <td className="center p-1" />

//                               <td className="right p-1" />

//                               <td className="center p-1" />

//                               <td className="center p-1" />

//                               <td className="right p-1">
//                                 {formatCurrency(totals.taxable)}
//                               </td>
//                             </tr>
//                             {!isInterState ? (
//                               <>
//                                 <tr>
//                                   <td className="center p-1 !pt-0" />

//                                   <td className="pre-wrap p-1 !pt-0 font-semibold italic text-right">
//                                     CGST
//                                   </td>

//                                   <td className="center p-1 !pt-0" />

//                                   <td className="center p-1 !pt-0" />

//                                   <td className="right p-1 !pt-0" />

//                                   <td className="center p-1 !pt-0" />

//                                   <td className="center p-1 !pt-0" />

//                                   <td className="right p-1 !pt-0 font-semibold italic">
//                                     {formatCurrency(totals.cgst)}
//                                   </td>
//                                 </tr>

//                                 <tr>
//                                   <td className="center p-1 !pt-0" />

//                                   <td className="pre-wrap p-1 !pt-0 font-semibold italic text-right">
//                                     SGST
//                                   </td>

//                                   <td className="center p-1 !pt-0" />

//                                   <td className="center p-1 !pt-0" />

//                                   <td className="right p-1 !pt-0" />

//                                   <td className="center p-1 !pt-0" />

//                                   <td className="center p-1 !pt-0" />

//                                   <td className="right p-1 !pt-0 font-semibold italic">
//                                     {formatCurrency(totals.sgst)}
//                                   </td>
//                                 </tr>
//                               </>
//                             ) : (
//                               <tr>
//                                 <td className="center p-1 !pt-0" />

//                                 <td className="pre-wrap p-1 !pt-0 font-semibold italic text-right">
//                                   IGST
//                                 </td>

//                                 <td className="center p-1 !pt-0" />

//                                 <td className="center p-1 !pt-0" />

//                                 <td className="right p-1 !pt-0" />

//                                 <td className="center p-1 !pt-0" />

//                                 <td className="center p-1 !pt-0" />

//                                 <td className="right p-1 !pt-0 font-semibold italic">
//                                   {formatCurrency(totals.igst)}
//                                 </td>
//                               </tr>
//                             )}

//                             {Math.abs(totals.roundOff) > 0.001 && (
//                               <tr>
//                                 <td className="center p-1 !pt-0" />

//                                 <td className="pre-wrap p-1 !pt-0 text-right font-semibold italic">
//                                   Round Off{" "}
//                                   {totals.roundOff > 0 ? "(+)" : "(-)"} :
//                                 </td>

//                                 <td className="center p-1 !pt-0" />

//                                 <td className="center p-1 !pt-0" />

//                                 <td className="right p-1 !pt-0" />

//                                 <td className="center p-1 !pt-0" />

//                                 <td className="center p-1 !pt-0" />

//                                 <td className="right p-1 !pt-0 font-semibold italic">
//                                   {formatCurrency(Math.abs(totals.roundOff))}
//                                 </td>
//                               </tr>
//                             )}

//                             <tr className="border-t border-black">
//                               <td className="center p-1" />

//                               <td className="pre-wrap p-1 text-right !text-xs">
//                                 Total
//                               </td>

//                               <td className="center p-1" />

//                               <td className="center p-1 !text-xs">
//                                 {totals.totalQuantity}
//                               </td>

//                               <td className="right p-1" />

//                               <td className="center p-1" />

//                               <td className="center p-1" />

//                               <td className="right p-1 !text-xs font-semibold">
//                                 ₹{formatCurrency(totals.rounded)}
//                               </td>
//                             </tr>
//                           </>
//                         )}
//                       </tbody>
//                     </table>
//                   </td>
//                 </tr>

//                 {isLastPage && (
//                   <>
//                     <tr>
//                       <td colSpan={2} className="words-section">
//                         <div>Amount Chargeable (in words)</div>

//                         <div className="bold">
//                           INR {convertToWords(totals.rounded)} Only
//                         </div>
//                       </td>
//                     </tr>

//                     <tr>
//                       <td colSpan={2}>
//                         <table className="gst-table">
//                           <thead>
//                             {!isInterState ? (
//                               <>
//                                 <tr>
//                                   <th rowSpan={2}>HSN/SAC</th>

//                                   <th rowSpan={2}>Taxable Value</th>

//                                   <th colSpan={2}>CGST</th>

//                                   <th colSpan={2}>SGST</th>

//                                   <th rowSpan={2}>Total Tax Amount</th>
//                                 </tr>

//                                 <tr>
//                                   <th>Rate</th>

//                                   <th>Amount</th>

//                                   <th>Rate</th>

//                                   <th className="!border-r !border-black">
//                                     Amount
//                                   </th>
//                                 </tr>
//                               </>
//                             ) : (
//                               <>
//                                 <tr>
//                                   <th rowSpan={2}>HSN/SAC</th>

//                                   <th rowSpan={2}>Taxable Value</th>

//                                   <th colSpan={2}>IGST</th>

//                                   <th rowSpan={2}>Total Tax Amount</th>
//                                 </tr>

//                                 <tr>
//                                   <th>Rate</th>

//                                   <th className="!border-r !border-black">
//                                     Amount
//                                   </th>
//                                 </tr>
//                               </>
//                             )}
//                           </thead>

//                           <tbody>
//                             {groupedGST.map((item, index) => (
//                               <tr key={index}>
//                                 <td>{item.hsn}</td>

//                                 <td className="right">
//                                   {formatCurrency(item.taxableValue)}
//                                 </td>

//                                 {!isInterState ? (
//                                   <>
//                                     <td className="center">
//                                       {item.gstRate / 2}%
//                                     </td>

//                                     <td className="right">
//                                       {formatCurrency(item.cgst)}
//                                     </td>

//                                     <td className="center">
//                                       {item.gstRate / 2}%
//                                     </td>

//                                     <td className="right">
//                                       {formatCurrency(item.sgst)}
//                                     </td>
//                                   </>
//                                 ) : (
//                                   <>
//                                     <td className="center">{item.gstRate}%</td>

//                                     <td className="right">
//                                       {formatCurrency(item.igst)}
//                                     </td>
//                                   </>
//                                 )}

//                                 <td className="right">
//                                   {formatCurrency(item.totalTax)}
//                                 </td>
//                               </tr>
//                             ))}

//                             <tr className="border-t border-black bold">
//                               <td className="!text-xs">Total</td>

//                               <td className="right !text-xs">
//                                 {formatCurrency(totals.taxable)}
//                               </td>

//                               {!isInterState ? (
//                                 <>
//                                   <td></td>

//                                   <td className="right !text-xs">
//                                     {formatCurrency(totals.cgst)}
//                                   </td>

//                                   <td></td>

//                                   <td className="right !text-xs">
//                                     {formatCurrency(totals.sgst)}
//                                   </td>
//                                 </>
//                               ) : (
//                                 <>
//                                   <td></td>

//                                   <td className="right !text-xs">
//                                     {formatCurrency(totals.igst)}
//                                   </td>
//                                 </>
//                               )}

//                               <td className="right !text-xs">
//                                 {formatCurrency(totals.gstAmount)}
//                               </td>
//                             </tr>
//                           </tbody>
//                         </table>
//                       </td>
//                     </tr>

//                     <tr>
//                       <td className="p-1 border-r border-black">
//                         <div>
//                           Tax Amount (in words) : INR{" "}
//                           {convertToWords(Number(totals.gstAmount.toFixed(2)))}{" "}
//                           Only
//                         </div>

//                         <div className="mt-8">
//                           Company’s PAN :{" "}
//                           <span className="font-semibold">AVDPT4124G</span>
//                         </div>

//                         <div className="mt-8 underline">Declaration</div>

//                         <div className="mt-4">
//                           1) We declare that this invoice shows the actual price
//                           of the goods described and that all particulars are
//                           true and correct.
//                         </div>

//                         <div>
//                           2) Goods once sold will not be taken back or exchange.
//                         </div>
//                       </td>

//                       <td className="signature-section p-1 !text-xs">
//                         <div className="underline">Company’s Bank Details</div>

//                         <div>
//                           Bank Name :{" "}
//                           <span className="font-semibold">
//                             Bank of Maharashtra
//                           </span>
//                         </div>

//                         <div>
//                           A/c No. :{" "}
//                           <span className="font-semibold">60554701463</span>
//                         </div>

//                         <div>
//                           Branch & IFSC Code :{" "}
//                           <span className="font-semibold">
//                             Ganeshguri & MAHB0001533
//                           </span>
//                         </div>
//                         <div className="company-sign">
//                           for CHINMOY DANISH ELECTRICAL PLUMBING SHOP
//                         </div>

//                         <div className="auth-sign">Authorised Signatory</div>
//                       </td>
//                     </tr>
//                   </>
//                 )}
//               </tbody>
//             </table>

//             {pages.length > 1 && (
//               <div className="page-number">
//                 Page {pageIndex + 1} of {pages.length}
//               </div>
//             )}

//             {isLastPage && (
//               <div className="footer">
//                 SUBJECT TO GUWAHATI JURISDICTION
//                 <br />
//                 This is a Computer Generated Invoice
//               </div>
//             )}
//           </div>
//         );
//       })}

//       <style jsx global>{`
//         * {
//           box-sizing: border-box;
//         }

//         body {
//           margin: 0;
//           padding: 0;
//           background: white;
//           font-family: Arial, Helvetica, sans-serif;
//           color: black;
//         }

//         .invoice-page {
//           width: 210mm;
//           min-height: 297mm;
//           padding: 5mm;
//           background: white;
//           page-break-after: always;
//         }

//         .main-table {
//           border: 1px solid black;
//         }

//         .main-table,
//         .meta-table,
//         .gst-table,
//         .totals-table {
//           table-layout: fixed;
//         }

//         .items-table {
//           table-layout: auto;
//         }

//         table {
//           width: 100%;
//           border-collapse: collapse;
//         }

//         .main-table td,
//         .main-table th {
//           font-size: 10px;
//           vertical-align: top;
//         }

//         .items-table thead th {
//           border-top: none;
//           border-bottom: 1px solid black;
//           border-right: 1px solid black;
//         }

//         .items-table thead th:last-child {
//           border-left: none;
//           border-right: none;
//         }

//         .items-table td {
//           border: none;
//           border-right: 1px solid black;
//           padding-top: 3px;
//           padding-bottom: 3px;
//         }

//         .items-table td:last-child {
//           border-right: none;
//         }

//         .items-table tbody tr td {
//           border-bottom: none;
//         }

//         .gst-table {
//           border-top: 1px solid black;
//           border-bottom: 1px solid black;
//         }

//         .gst-table th,
//         .gst-table td {
//           border-right: 1px solid black;
//           padding: 2px 4px;
//         }

//         .gst-table th:last-child,
//         .gst-table td:last-child {
//           border-right: none;
//         }

//         .gst-table thead {
//           border-bottom: 1px solid black;
//         }

//         .gst-table thead tr:first-child th {
//           text-align: center;
//           font-weight: bold;
//         }

//         .gst-table thead tr:last-child th {
//           border-top: 1px solid black;
//         }

//         .meta-table td {
//           border-bottom: 1px solid black;
//         }

//         .meta-table tr:last-child td {
//           border-bottom: none;
//         }

//         .invoice-title {
//           text-align: center;
//           font-size: 18px;
//           font-weight: bold;
//         }

//         .company-name {
//           font-size: 12px;
//           font-weight: bold;
//         }

//         .buyer-title,
//         .bold {
//           font-weight: bold;
//         }

//         .pre-wrap {
//           white-space: pre-wrap;
//           word-break: break-word;
//         }

//         .center {
//           text-align: center;
//         }

//         .right {
//           text-align: right;
//         }

//         .sl-col {
//           width: 4%;
//         }

//         .desc-col {
//           width: 46%;
//         }

//         .hsn-col {
//           width: 10%;
//         }

//         .qty-col {
//           width: 8%;
//         }

//         .rate-col {
//           width: 9%;
//         }

//         .unit-col {
//           width: 6%;
//         }

//         .disc-col {
//           width: 7%;
//         }

//         .amt-col {
//           width: 10%;
//         }

//         .buyer-section {
//           border-top: 1px solid black;
//           border-bottom: 1px solid black;
//         }

//         .words-section {
//           border-top: 1px solid black;
//           padding: 5px;
//           line-height: 1.4;
//         }

//         .signature-section {
//           vertical-align: bottom;
//         }

//         .company-sign {
//           margin-top: 60px;
//           font-weight: bold;
//           text-align: right;
//         }

//         .auth-sign {
//           margin-top: 40px;
//           text-align: right;
//         }

//         .footer {
//           text-align: center;
//           font-size: 10px;
//         }

//         .page-number {
//           text-align: right;
//           font-size: 10px;
//           margin-top: 4px;
//         }

//         .meta-grid {
//           display: grid;
//           grid-template-columns:
//             120px
//             10px
//             1fr;
//           row-gap: 2px;
//         }

//         .meta-value {
//           word-break: break-word;
//         }

//         .mt-4 {
//           margin-top: 4px;
//         }

//         .mt-8 {
//           margin-top: 8px;
//         }

//         @media print {
//           body {
//             margin: 0;
//             padding: 0;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           .invoice-page {
//             margin: 0;
//             page-break-after: always;
//           }

//           table {
//             page-break-inside: auto;
//           }

//           tr {
//             page-break-inside: avoid;
//           }

//           thead {
//             display: table-header-group;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default GSTInvoice;

"use client";

import React, { useMemo } from "react";
import { convertToDateFormat, convertToWords } from "../utils/helper";
import { AddOn } from "@/@types/server/response";

interface Party {
  name: string;
  address: string;
  gstin?: string;
  state: string;
  stateCode: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  gstRate: number;
  quantity: number;
  rate: number;

  isSubUnit?: boolean;
  unit?: string;
  subUnit?: string;
  conversionRate?: number;

  discount?: number;
}

interface InvoiceData {
  invoiceNo: string;
  invoiceDate: string;

  transporterName?: string;
  dispatchedThrough?: string;
  destination?: string;

  buyer: Party;

  items: InvoiceItem[];

  addOns?: AddOn[];
}

interface ProcessedInvoiceItem extends InvoiceItem {
  serialNumber: number;
  baseRate: number;
  gross: number;
  taxableValue: number;
  discountAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

interface GSTGroup {
  hsn: string;
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

interface Props {
  data: InvoiceData;
  type: "invoices" | "proforma-invoices";
}

const PAGE_HEIGHT = 1020;
const FIRST_PAGE_FIXED_HEIGHT = 320;
const OTHER_PAGE_FIXED_HEIGHT = 180;

const GSTInvoice = ({ data, type }: Props) => {
  const isInterState = data.buyer.stateCode !== "18";

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const estimateRowHeight = (item: InvoiceItem) => {
    const baseHeight = 24;

    const charsPerLine = 42;

    const lineCount = Math.ceil(item.description.length / charsPerLine);

    return baseHeight + (lineCount - 1) * 14;
  };

  const processedItems = useMemo((): ProcessedInvoiceItem[] => {
    return data.items.map((item, globalIndex) => {
      const gstMultiplier = 1 + item.gstRate / 100;

      const baseRate = item.rate / gstMultiplier;

      const gross = item.isSubUnit
        ? (item.quantity * baseRate) / (item?.conversionRate ?? 1)
        : item.quantity * baseRate;

      const discountAmount = gross * ((item.discount || 0) / 100);

      const taxableValue = gross - discountAmount;

      const gstAmount = taxableValue * (item.gstRate / 100);

      const cgst = isInterState ? 0 : gstAmount / 2;

      const sgst = isInterState ? 0 : gstAmount / 2;

      const igst = isInterState ? gstAmount : 0;

      return {
        ...item,

        serialNumber: globalIndex + 1,

        baseRate,

        gross,

        taxableValue,

        discountAmount,

        gstAmount,

        cgst,

        sgst,

        igst,

        total: taxableValue + gstAmount,
      };
    });
  }, [data.items, isInterState]);

  const groupedGST = useMemo((): GSTGroup[] => {
    const map = new Map<string, GSTGroup>();

    processedItems.forEach((item) => {
      const key = `${item.hsn}_${item.gstRate}`;

      if (!map.has(key)) {
        map.set(key, {
          hsn: item.hsn,

          gstRate: item.gstRate,

          taxableValue: 0,

          cgst: 0,

          sgst: 0,

          igst: 0,

          totalTax: 0,
        });
      }

      const existing = map.get(key)!;

      existing.taxableValue += item.taxableValue;

      existing.cgst += item.cgst;

      existing.sgst += item.sgst;

      existing.igst += item.igst;

      existing.totalTax += item.gstAmount;
    });

    return Array.from(map.values());
  }, [processedItems]);

  const totals = useMemo(() => {
    const taxable = processedItems.reduce(
      (acc, item) => acc + item.taxableValue,
      0,
    );

    const cgst = processedItems.reduce((acc, item) => acc + item.cgst, 0);

    const sgst = processedItems.reduce((acc, item) => acc + item.sgst, 0);

    const igst = processedItems.reduce((acc, item) => acc + item.igst, 0);

    const gstAmount = processedItems.reduce(
      (acc, item) => acc + item.gstAmount,
      0,
    );

    const totalQuantity = processedItems.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );

    const addOnTotal = (data.addOns || []).reduce(
      (acc, item) => acc + item.price,
      0,
    );

    const total = taxable + gstAmount + addOnTotal;

    const rounded = Math.round(total);

    const roundOff = rounded - total;

    return {
      taxable,

      cgst,

      sgst,

      igst,

      gstAmount,

      totalQuantity,

      addOnTotal,

      total,

      rounded,

      roundOff,
    };
  }, [processedItems, data.addOns]);

  const calculateLastPageReservedHeight = () => {
    const gstRows = groupedGST.length;

    const addOnRows = data.addOns?.length || 0;

    return 460 + gstRows * 28 + addOnRows * 24;
  };
  const pages = useMemo(() => {
    const tempPages: ProcessedInvoiceItem[][] = [];

    let currentPage: ProcessedInvoiceItem[] = [];

    let usedHeight = FIRST_PAGE_FIXED_HEIGHT;

    /**
     * STEP 1
     * Normal pagination
     * WITHOUT last-page restriction
     */

    processedItems.forEach((item) => {
      const rowHeight = estimateRowHeight(item);

      const maxHeight = tempPages.length === 0 ? PAGE_HEIGHT : PAGE_HEIGHT;

      if (usedHeight + rowHeight > maxHeight) {
        tempPages.push(currentPage);

        currentPage = [];

        usedHeight = OTHER_PAGE_FIXED_HEIGHT;
      }

      currentPage.push(item);

      usedHeight += rowHeight;
    });

    if (currentPage.length) {
      tempPages.push(currentPage);
    }

    /**
     * STEP 2
     * Fix last page overflow
     */

    const lastPageReservedHeight = calculateLastPageReservedHeight();

    const lastPage = tempPages[tempPages.length - 1];

    let lastPageHeight = OTHER_PAGE_FIXED_HEIGHT;

    lastPage.forEach((item) => {
      lastPageHeight += estimateRowHeight(item);
    });

    /**
     * Actual allowed height
     */

    const allowedLastPageHeight = PAGE_HEIGHT - lastPageReservedHeight;

    /**
     * Move items backward
     * until footer fits
     */

    while (lastPageHeight > allowedLastPageHeight && lastPage.length > 1) {
      const shifted = lastPage.shift();

      if (!shifted) break;

      lastPageHeight -= estimateRowHeight(shifted);

      /**
       * Create new page before last
       * if needed
       */

      if (tempPages.length < 2) {
        tempPages.unshift([]);
      }

      tempPages[tempPages.length - 2].push(shifted);
    }

    return tempPages;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedItems, groupedGST, data.addOns]);

  const calculateEmptyRows = (
    pageItems: ProcessedInvoiceItem[],
    isLastPage: boolean,
  ) => {
    const usedHeight = pageItems.reduce(
      (acc, item) => acc + estimateRowHeight(item),
      0,
    );

    const reservedHeight = isLastPage ? calculateLastPageReservedHeight() : 120;

    const remainingHeight = PAGE_HEIGHT - reservedHeight - usedHeight;

    return Math.max(0, Math.floor(remainingHeight / 26));
  };

  return (
    <div>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;

        return (
          <div key={pageIndex} className="invoice-page">
            <div className="invoice-title p-1 !text-sm">
              {type === "invoices" ? "Tax Invoice" : "Proforma Invoice"}
            </div>

            <table className="main-table">
              <tbody>
                <tr>
                  <td className="company-block border-r border-black p-1">
                    <div className="company-name">
                      CHINMOY DANISH ELECTRICAL PLUMBING SHOP
                    </div>

                    <div>
                      Khagen Mahanta Road, Hengrabari, Near Kali Mandir, Kamrup
                      Metro
                    </div>

                    <div>Guwahati - 781036, Assam</div>

                    <div>GSTIN/UIN: 18AVDPT4124G1ZK</div>

                    <div>State Name : Assam, Code : 18</div>

                    <div>Contact : 60026-57792</div>
                  </td>

                  <td className="details-block p-2 text-[10px] align-top">
                    <div className="meta-grid">
                      <div className="meta-label">Invoice No.</div>

                      <span>:</span>

                      <div className="meta-value font-semibold">
                        {data.invoiceNo}
                      </div>

                      <div className="meta-label">Dated</div>

                      <span>:</span>

                      <div className="meta-value">
                        {convertToDateFormat(data.invoiceDate)}
                      </div>

                      <div className="meta-label">Transporter Name</div>

                      <span>:</span>

                      <div className="meta-value">{data.transporterName}</div>

                      <div className="meta-label">Vehicle Number</div>

                      <span>:</span>

                      <div className="meta-value">{data.dispatchedThrough}</div>

                      <div className="meta-label">Destination</div>

                      <span>:</span>

                      <div className="meta-value">{data.destination}</div>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td colSpan={2} className="buyer-section p-1">
                    <div className="buyer-title">Buyer (Bill to)</div>

                    <div className="buyer-name">Name : {data.buyer.name}</div>

                    <div className="pre-wrap">
                      Address : {data.buyer.address}
                    </div>

                    <div>GSTIN/UIN : {data.buyer.gstin}</div>

                    <div>
                      State Name : {data.buyer.state}, Code :
                      {data.buyer.stateCode}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td colSpan={2}>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th className="sl-col p-1">Sl</th>

                          <th className="desc-col p-1">Description of Goods</th>

                          <th className="hsn-col p-1">HSN/SAC</th>

                          <th className="qty-col p-1">Qty</th>

                          <th className="rate-col p-1">Rate (₹)</th>

                          <th className="unit-col p-1">UOM</th>

                          <th className="disc-col p-1">Disc (%)</th>

                          <th className="amt-col p-1">Amount (₹)</th>
                        </tr>
                      </thead>

                      <tbody>
                        {pageItems.map((item) => (
                          <tr key={item.id}>
                            <td className="center p-1">{item.serialNumber}</td>

                            <td className="pre-wrap p-1">{item.description}</td>

                            <td className="center p-1">{item.hsn}</td>

                            <td className="center p-1">{item.quantity}</td>

                            <td className="right p-1">
                              {formatCurrency(item.baseRate)}
                            </td>

                            <td className="center p-1">
                              {item.isSubUnit ? item.subUnit : item.unit}
                            </td>

                            <td className="center p-1">
                              {item.discount || ""}
                            </td>

                            <td className="right p-1">
                              {formatCurrency(item.taxableValue)}
                            </td>
                          </tr>
                        ))}

                        {Array.from({
                          length: isLastPage
                            ? calculateEmptyRows(pageItems, isLastPage) - 1
                            : calculateEmptyRows(pageItems, isLastPage),
                        }).map((_, index) => (
                          <tr key={`empty-${index}`}>
                            <td className="p-1">&nbsp;</td>

                            <td className="p-1">&nbsp;</td>

                            <td className="p-1">&nbsp;</td>

                            <td className="p-1">&nbsp;</td>

                            <td className="p-1">&nbsp;</td>

                            <td className="p-1">&nbsp;</td>

                            <td className="p-1">&nbsp;</td>

                            <td className="p-1">&nbsp;</td>
                          </tr>
                        ))}

                        {isLastPage && (
                          <>
                            <tr>
                              <td />
                              <td />
                              <td />
                              <td />
                              <td />
                              <td />
                              <td />
                              <td className="!pt-3 flex items-center justify-center">
                                <div className="!w-[90%] !h-[0.5px] !bg-black" />
                              </td>
                            </tr>
                            <tr>
                              <td />
                              <td className="text-right italic font-semibold p-1">
                                Subtotal
                              </td>
                              <td />
                              <td />
                              <td />
                              <td />
                              <td />
                              <td className="right p-1">
                                {formatCurrency(totals.taxable)}
                              </td>
                            </tr>

                            {data.addOns?.map((addOn, index) => (
                              <tr key={index}>
                                <td />

                                <td className="text-right italic font-semibold p-1">
                                  {addOn.title}
                                </td>

                                <td />
                                <td />
                                <td />
                                <td />
                                <td />

                                <td className="right italic font-semibold p-1">
                                  {formatCurrency(addOn.price)}
                                </td>
                              </tr>
                            ))}

                            {!isInterState ? (
                              <>
                                <tr>
                                  <td />

                                  <td className="text-right italic font-semibold p-1">
                                    CGST
                                  </td>

                                  <td />
                                  <td />
                                  <td />
                                  <td />
                                  <td />

                                  <td className="right italic font-semibold p-1">
                                    {formatCurrency(totals.cgst)}
                                  </td>
                                </tr>

                                <tr>
                                  <td />

                                  <td className="text-right italic font-semibold p-1">
                                    SGST
                                  </td>

                                  <td />
                                  <td />
                                  <td />
                                  <td />
                                  <td />

                                  <td className="right italic font-semibold p-1">
                                    {formatCurrency(totals.sgst)}
                                  </td>
                                </tr>
                              </>
                            ) : (
                              <tr>
                                <td />

                                <td className="text-right italic font-semibold p-1">
                                  IGST
                                </td>

                                <td />
                                <td />
                                <td />
                                <td />
                                <td />

                                <td className="right italic font-semibold p-1">
                                  {formatCurrency(totals.igst)}
                                </td>
                              </tr>
                            )}

                            {Math.abs(totals.roundOff) > 0.001 && (
                              <tr>
                                <td />

                                <td className="text-right italic font-semibold p-1">
                                  Round Off{" "}
                                  {totals.roundOff > 0 ? "(+)" : "(-)"}
                                </td>

                                <td />
                                <td />
                                <td />
                                <td />
                                <td />

                                <td className="right italic font-semibold p-1">
                                  {formatCurrency(Math.abs(totals.roundOff))}
                                </td>
                              </tr>
                            )}

                            <tr className="border-t border-black">
                              <td />

                              <td className="text-right font-semibold p-1 !text-xs">
                                Grand Total
                              </td>

                              <td />

                              <td className="center font-semibold p-1 !text-xs">
                                {totals.totalQuantity}
                              </td>

                              <td />
                              <td />
                              <td />

                              <td className="right font-semibold p-1 !text-xs">
                                ₹{formatCurrency(totals.rounded)}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>

                {isLastPage && (
                  <>
                    <tr>
                      <td colSpan={2} className="words-section">
                        <div>Amount Chargeable (in words)</div>

                        <div className="bold !text-xs">
                          INR {convertToWords(totals.rounded)} Only
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2}>
                        <table className="gst-table">
                          <thead>
                            {!isInterState ? (
                              <>
                                <tr>
                                  <th rowSpan={2}>HSN/SAC</th>

                                  <th rowSpan={2}>Taxable Value</th>

                                  <th colSpan={2}>CGST</th>

                                  <th colSpan={2}>SGST</th>

                                  <th
                                    rowSpan={2}
                                    className="border-l border-black"
                                  >
                                    Total Tax Amount
                                  </th>
                                </tr>

                                <tr className="border-t border-black">
                                  <th>Rate</th>

                                  <th>Amount</th>

                                  <th>Rate</th>

                                  <th>Amount</th>
                                </tr>
                              </>
                            ) : (
                              <>
                                <tr>
                                  <th rowSpan={2}>HSN/SAC</th>

                                  <th rowSpan={2}>Taxable Value</th>

                                  <th colSpan={2}>IGST</th>

                                  <th rowSpan={2}>Total Tax Amount</th>
                                </tr>

                                <tr>
                                  <th>Rate</th>

                                  <th>Amount</th>
                                </tr>
                              </>
                            )}
                          </thead>

                          <tbody>
                            {groupedGST.map((item, index) => (
                              <tr key={index}>
                                <td>{item.hsn}</td>

                                <td className="right">
                                  {formatCurrency(item.taxableValue)}
                                </td>

                                {!isInterState ? (
                                  <>
                                    <td className="center">
                                      {item.gstRate / 2}%
                                    </td>

                                    <td className="right">
                                      {formatCurrency(item.cgst)}
                                    </td>

                                    <td className="center">
                                      {item.gstRate / 2}%
                                    </td>

                                    <td className="right">
                                      {formatCurrency(item.sgst)}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="center">{item.gstRate}%</td>

                                    <td className="right">
                                      {formatCurrency(item.igst)}
                                    </td>
                                  </>
                                )}

                                <td className="right">
                                  {formatCurrency(item.totalTax)}
                                </td>
                              </tr>
                            ))}

                            <tr className="border-t border-black bold">
                              <td className="!text-xs">Total</td>

                              <td className="right !text-xs">
                                {formatCurrency(totals.taxable)}
                              </td>

                              {!isInterState ? (
                                <>
                                  <td></td>

                                  <td className="right !text-xs">
                                    {formatCurrency(totals.cgst)}
                                  </td>

                                  <td></td>

                                  <td className="right !text-xs">
                                    {formatCurrency(totals.sgst)}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td></td>

                                  <td className="right !text-xs">
                                    {formatCurrency(totals.igst)}
                                  </td>
                                </>
                              )}

                              <td className="right !text-xs">
                                {formatCurrency(totals.gstAmount)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td className="bank-details p-1 align-top border-r border-black">
                        <div>
                          Tax Amount (in words) : INR{" "}
                          {convertToWords(Number(totals.gstAmount.toFixed(2)))}{" "}
                          Only
                        </div>

                        <div className="mt-8">Company’s Bank Details :</div>

                        <div>
                          Bank Name :{" "}
                          <span className="font-semibold">
                            Bank of Maharashtra
                          </span>
                        </div>

                        <div>
                          A/c No. :{" "}
                          <span className="font-semibold">60554701463</span>
                        </div>

                        <div>
                          Branch & IFSC Code :{" "}
                          <span className="font-semibold">
                            Ganeshguri & MAHB0001533
                          </span>
                        </div>
                      </td>

                      <td className="signature-section p-2">
                        <div className="company-sign text-nowrap !mt-1">
                          for CHINMOY DANISH ELECTRICAL PLUMBING SHOP
                        </div>

                        <div className="auth-sign">Authorised Signatory</div>
                      </td>
                    </tr>

                    <tr className="border-t border-black">
                      <td className="p-1" colSpan={2}>
                        <div>Declaration :</div>

                        <div>
                          1) We declare that this invoice shows the actual price
                          of the goods described and that all particulars are
                          true and correct.
                        </div>

                        <div>
                          2) Goods once sold will not be taken back or exchange.
                        </div>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {isLastPage && (
              <div className="flex items-center justify-center text-center p-1 text-[10px]">
                SUBJECT TO GUWAHATI JURISDICTION
                <br />
                This is a Computer Generated Invoice
              </div>
            )}

            {!isLastPage && (
              <div className="continued-label">continued to next page</div>
            )}

            {pages.length > 1 && (
              <div className="page-number">
                Page {pageIndex + 1} of {pages.length}
              </div>
            )}
          </div>
        );
      })}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          color: black;
        }

        .invoice-page {
          width: 210mm;
          min-height: 297mm;
          padding: 7mm 10mm;
          background: white;
          page-break-after: always;
        }

        .main-table {
          border: 1px solid black;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        .main-table td,
        .main-table th {
          font-size: 10px;
          vertical-align: top;
        }

        .items-table {
          table-layout: auto;
        }

        .items-table thead th {
          border-bottom: 1px solid black;
          border-right: 1px solid black;
        }

        .items-table thead th:last-child {
          border-right: none;
        }

        .items-table td {
          border-right: 1px solid black;
          padding-top: 3px;
          padding-bottom: 3px;
        }

        .items-table td:last-child {
          border-right: none;
        }

        .gst-table {
          border-top: 1px solid black;
          border-bottom: 1px solid black;
        }

        .gst-table th,
        .gst-table td {
          border-right: 1px solid black;
          padding: 2px 4px;
        }

        .gst-table th:last-child,
        .gst-table td:last-child {
          border-right: none;
        }

        .gst-table thead {
          border-bottom: 1px solid black;
        }

        .invoice-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
        }

        .company-name {
          font-size: 12px;
          font-weight: bold;
        }

        .buyer-title,
        .bold {
          font-weight: bold;
        }

        .pre-wrap {
          white-space: pre-wrap;
          word-break: break-word;
        }

        .center {
          text-align: center;
        }

        .right {
          text-align: right;
        }

        .sl-col {
          width: 4%;
        }

        .desc-col {
          width: 46%;
        }

        .hsn-col {
          width: 10%;
        }

        .qty-col {
          width: 8%;
        }

        .rate-col {
          width: 9%;
        }

        .unit-col {
          width: 6%;
        }

        .disc-col {
          width: 7%;
        }

        .amt-col {
          width: 10%;
        }

        .buyer-section {
          border-top: 1px solid black;
          border-bottom: 1px solid black;
        }

        .words-section {
          border-top: 1px solid black;
          padding: 5px;
          line-height: 1.4;
        }

        .meta-grid {
          display: grid;
          grid-template-columns:
            120px
            10px
            1fr;
          row-gap: 2px;
        }

        .continued-label {
          text-align: right;
          font-size: 10px;
          margin-top: 6px;
          font-style: italic;
        }

        .page-number {
          text-align: right;
          font-size: 10px;
          margin-top: 4px;
        }

        .company-sign {
          font-weight: bold;
          text-align: right;
        }

        .auth-sign {
          margin-top: 40px;
          text-align: right;
        }

        .mt-8 {
          margin-top: 8px;
        }

        .mt-4 {
          margin-top: 4px;
        }

        .bank-details {
          width: 60%;
        }

        .signature-section {
          width: 40%;
        }

        .company-block {
          width: 50%;
        }

        .details-block {
          width: 50%;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .invoice-page {
            margin: 0;
            page-break-after: always;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
          }

          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </div>
  );
};

export default GSTInvoice;

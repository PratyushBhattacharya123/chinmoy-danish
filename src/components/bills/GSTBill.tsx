"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  AddOn,
  EnrichedBillsResponse,
  EnrichedItem,
  PartyDetailsResponse,
} from "@/@types/server/response";
import {
  capitalize,
  convertToDateFormat,
  convertToWords,
} from "@/components/utils/helper";
import Image from "next/image";

interface GSTBillProps {
  billData: EnrichedBillsResponse;
  type: "invoices" | "proforma-invoices";
}

type LineItem =
  | (EnrichedItem & { type: "product"; serialOffset: number })
  | (AddOn & { type: "addon"; serialOffset: number });

interface ItemBreakup {
  price: number;
  taxableValue: number;
  discount: number;
  discountedAmount: number;
  igst: number;
  cgst: number;
  sgst: number;
  itemTotal: number;
}

const GSTBillTemplate: React.FC<GSTBillProps> = ({ billData, type }) => {
  const [partyDetails, setPartyDetails] = useState<PartyDetailsResponse>();
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [isInterState, setIsInterState] = useState(false);

  useEffect(() => {
    if (billData && billData.items && billData.partyDetails) {
      setItems(billData.items);
      setPartyDetails(billData.partyDetails);
      setIsInterState(billData.partyDetails.stateCode !== "18");
      setAddOns(billData.addOns || []);
    }
  }, [billData]);

  // Helper function to format currency
  const formatCurrency = (num: number): string => {
    return Number(num.toFixed(2)).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Combine items and add-ons for pagination
  const allLineItems = useMemo((): LineItem[] => {
    const regularItems: LineItem[] = items.map((item) => ({
      ...item,
      type: "product" as const,
      serialOffset: 0,
    }));

    const addOnItems: LineItem[] = addOns.map((addOn) => ({
      ...addOn,
      type: "addon" as const,
      serialOffset: items.length,
    }));

    return [...regularItems, ...addOnItems];
  }, [items, addOns]);

  // Calculate items per page - last page gets only 3 items for footer space
  const calculateItemsPerPage = (
    pageIndex: number,
    totalPages: number
  ): number => {
    const ITEMS_PER_PAGE = 8;
    const ITEMS_ON_LAST_PAGE = 3;

    if (pageIndex === totalPages - 1) {
      return ITEMS_ON_LAST_PAGE;
    }
    return ITEMS_PER_PAGE;
  };

  // Calculate total pages considering last page has only 3 items
  const calculateTotalPages = (itemsCount: number): number => {
    const ITEMS_PER_PAGE = 8;
    const ITEMS_ON_LAST_PAGE = 3;

    if (itemsCount <= ITEMS_ON_LAST_PAGE) {
      return 1;
    }

    const remainingItems = itemsCount - ITEMS_ON_LAST_PAGE;
    const fullPages = Math.ceil(remainingItems / ITEMS_PER_PAGE);
    return fullPages + 1;
  };

  // Get items for specific page
  const getItemsForPage = (
    pageIndex: number,
    totalPages: number
  ): LineItem[] => {
    let startIndex = 0;

    for (let i = 0; i < pageIndex; i++) {
      const itemsPerPage = calculateItemsPerPage(i, totalPages);
      startIndex += itemsPerPage;
    }

    const itemsPerPage = calculateItemsPerPage(pageIndex, totalPages);
    return allLineItems.slice(startIndex, startIndex + itemsPerPage);
  };

  // Calculate taxable amount and GST amounts (only for products, not add-ons)
  const { taxableAmount, gstAmount, addOnsTotal } = useMemo(() => {
    if (items.length === 0 && addOns.length === 0) {
      return {
        taxableAmount: 0,
        gstAmount: 0,
        addOnsTotal: 0,
        totalDiscount: 0,
      };
    }

    let totalTaxable = 0;
    let totalGST = 0;
    let totalAddOns = 0;
    let totalItemDiscount = 0;

    // Calculate for regular items (with GST)
    items.forEach((item) => {
      const itemTotal = item.quantity * (item.productDetails?.price || 0);
      const discountPercentage = item.discountPercentage || 0;
      const discountAmount = (itemTotal * discountPercentage) / 100;
      const discountedTotal = itemTotal - discountAmount;

      const gstSlab = item.productDetails?.gstSlab || 18;
      const gstRate = gstSlab / 100;
      const taxableValue = discountedTotal / (1 + gstRate);
      const gstValue = discountedTotal - taxableValue;

      totalTaxable += taxableValue;
      totalGST += gstValue;
      totalItemDiscount += discountAmount;
    });

    // Calculate for add-ons (without GST)
    addOns.forEach((addOn) => {
      totalAddOns += addOn.price;
    });

    return {
      taxableAmount: totalTaxable,
      gstAmount: totalGST,
      addOnsTotal: totalAddOns,
      totalDiscount: totalItemDiscount,
    };
  }, [items, addOns]);

  // Calculate rounding difference and final total
  const { roundingDifference, finalTotal } = useMemo(() => {
    const totalBeforeRounding = taxableAmount + gstAmount + addOnsTotal;
    const roundedTotal = Math.round(totalBeforeRounding);
    const roundingDifference = roundedTotal - totalBeforeRounding;

    return {
      roundingDifference,
      finalTotal: roundedTotal,
    };
  }, [taxableAmount, gstAmount, addOnsTotal]);

  // Calculate grand total
  const grandTotal = finalTotal;

  // Calculate item total with GST separation (only for products)
  const calculateItemBreakup = (item: LineItem): ItemBreakup => {
    if (item.type === "addon") {
      // Add-ons don't have GST
      return {
        price: 0,
        taxableValue: 0,
        discount: 0,
        discountedAmount: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        itemTotal: item.price,
      };
    }

    // Regular product with GST
    const itemTotal = item.quantity * (item.productDetails?.price || 0);
    const discountPercentage = item.discountPercentage || 0;
    const discountAmount = (itemTotal * discountPercentage) / 100;
    const discountedTotal = itemTotal - discountAmount;

    const gstSlab = item.productDetails?.gstSlab || 18;
    const gstRate = gstSlab / 100;

    const price = (item.productDetails?.price || 0) / (1 + gstRate);
    const taxableValue = discountedTotal / (1 + gstRate);
    const gstValue = discountedTotal - taxableValue;

    if (isInterState) {
      return {
        price,
        taxableValue,
        discount: discountPercentage,
        discountedAmount: discountAmount,
        igst: gstValue,
        cgst: 0,
        sgst: 0,
        itemTotal: discountedTotal,
      };
    } else {
      return {
        price,
        taxableValue,
        discount: discountPercentage,
        discountedAmount: discountAmount,
        igst: 0,
        cgst: gstValue / 2,
        sgst: gstValue / 2,
        itemTotal: discountedTotal,
      };
    }
  };

  const amountInWords = grandTotal
    ? convertToWords(Math.round(grandTotal)) + " Rupees Only"
    : "Zero Rupees Only";

  const renderItemsTable = (
    pageItems: LineItem[],
    pageNumber: number,
    totalPages: number
  ) => {
    const itemsPerPage = calculateItemsPerPage(pageNumber - 1, totalPages);

    return (
      <div key={pageNumber} style={{ marginBottom: "16px" }}>
        <table
          style={{
            width: "100%",
            fontSize: "11px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "rgb(249, 250, 251)" }}>
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  width: "40px",
                }}
              >
                SI No.
              </th>
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  minWidth: "100px",
                  textAlign: "center",
                }}
              >
                Name of the Product
              </th>
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  width: "64px",
                }}
              >
                HSN/ SAC
              </th>
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  width: "48px",
                }}
              >
                UOM
              </th>
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  width: "48px",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  width: "64px",
                }}
              >
                Rate (₹)
              </th>
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  width: "64px",
                }}
              >
                Amount (₹)
              </th>
              {/* New Discount Column */}
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  width: "48px",
                }}
              >
                Disc. (%)
              </th>
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  width: "64px",
                }}
              >
                Disc. Amt (₹)
              </th>
              {isInterState ? (
                <>
                  <th
                    style={{
                      border: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      width: "48px",
                    }}
                  >
                    IGST Rate (%)
                  </th>
                  <th
                    style={{
                      border: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      width: "64px",
                    }}
                  >
                    IGST Amt (₹)
                  </th>
                </>
              ) : (
                <>
                  <th
                    style={{
                      border: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      width: "48px",
                    }}
                  >
                    CGST Rate (%)
                  </th>
                  <th
                    style={{
                      border: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      width: "64px",
                    }}
                  >
                    CGST Amt (₹)
                  </th>
                  <th
                    style={{
                      border: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      width: "48px",
                    }}
                  >
                    SGST Rate (%)
                  </th>
                  <th
                    style={{
                      border: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      width: "64px",
                    }}
                  >
                    SGST Amount (₹)
                  </th>
                </>
              )}
              <th
                style={{
                  border: "1px solid rgb(209, 213, 219)",
                  padding: "4px",
                  width: "64px",
                }}
              >
                Total (₹)
              </th>
            </tr>
          </thead>
          <tbody style={{ border: "1px solid rgb(209, 213, 219)" }}>
            {pageItems.map((item, index) => {
              const breakup = calculateItemBreakup(item);
              let serialNo = index + 1;
              for (let i = 0; i < pageNumber - 1; i++) {
                serialNo += calculateItemsPerPage(i, totalPages);
              }

              const isAddOn = item.type === "addon";
              const gstRate = isInterState
                ? (item.type === "product"
                    ? item.productDetails?.gstSlab
                    : 18) || 18
                : ((item.type === "product"
                    ? item.productDetails?.gstSlab
                    : 18) || 18) / 2;

              return (
                <tr
                  key={index}
                  style={{
                    height: isAddOn ? "30px" : isInterState ? "45px" : "56px",
                    fontSize: "11px",
                  }}
                >
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "center",
                    }}
                  >
                    {isAddOn ? "" : serialNo}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    {isAddOn ? (
                      <span style={{ fontStyle: "italic", color: "#666" }}>
                        {item.title}
                      </span>
                    ) : (
                      item.productDetails?.name || "Product Not Found"
                    )}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "center",
                    }}
                  >
                    {isAddOn ? "" : item.productDetails?.hsnCode || "N/A"}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "center",
                    }}
                  >
                    {isAddOn
                      ? ""
                      : capitalize(item.productDetails?.unit || "pcs")}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "right",
                    }}
                  >
                    {isAddOn ? "" : item.quantity}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "right",
                    }}
                  >
                    {isAddOn ? "" : formatCurrency(breakup.price)}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "right",
                    }}
                  >
                    {isAddOn
                      ? ""
                      : formatCurrency(
                          item.quantity * (item.productDetails?.price || 0)
                        )}
                  </td>
                  {/* Discount Percentage */}
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "center",
                    }}
                  >
                    {isAddOn
                      ? ""
                      : breakup.discount > 0
                      ? `${breakup.discount}%`
                      : ""}
                  </td>
                  {/* Discount Amount */}
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "right",
                    }}
                  >
                    {isAddOn
                      ? ""
                      : breakup.discount > 0
                      ? formatCurrency(breakup.discountedAmount)
                      : ""}
                  </td>

                  {isInterState ? (
                    <>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                          textAlign: "center",
                        }}
                      >
                        {isAddOn
                          ? ""
                          : `${
                              item.type === "product"
                                ? item.productDetails?.gstSlab
                                : 18
                            }%`}
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                          textAlign: "right",
                        }}
                      >
                        {isAddOn ? "" : formatCurrency(breakup.igst)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                          textAlign: "center",
                        }}
                      >
                        {isAddOn ? "" : `${gstRate}%`}
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                          textAlign: "right",
                        }}
                      >
                        {isAddOn ? "" : formatCurrency(breakup.cgst)}
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                          textAlign: "center",
                        }}
                      >
                        {isAddOn ? "" : `${gstRate}%`}
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                          textAlign: "right",
                        }}
                      >
                        {isAddOn ? "" : formatCurrency(breakup.sgst)}
                      </td>
                    </>
                  )}

                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {formatCurrency(breakup.itemTotal)}
                  </td>
                </tr>
              );
            })}

            {/* Fill remaining rows for consistent layout */}
            {Array.from({ length: itemsPerPage - pageItems.length }).map(
              (_, index) => (
                <tr key={`empty-${index}`} style={{ height: "56px" }}>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                      textAlign: "center",
                    }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    &nbsp;
                  </td>
                  {/* Empty discount columns */}
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    &nbsp;
                  </td>

                  {isInterState ? (
                    <>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                        }}
                      >
                        &nbsp;
                      </td>
                    </>
                  ) : (
                    <>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                        }}
                      >
                        &nbsp;
                      </td>
                      <td
                        style={{
                          borderRight: "1px solid rgb(209, 213, 219)",
                          padding: "4px",
                        }}
                      >
                        &nbsp;
                      </td>
                    </>
                  )}

                  <td
                    style={{
                      borderRight: "1px solid rgb(209, 213, 219)",
                      padding: "4px",
                    }}
                  >
                    &nbsp;
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Show error state if no data
  if (!billData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "256px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "rgb(220, 38, 38)" }}>No bill data available</p>
        </div>
      </div>
    );
  }

  const totalPages = calculateTotalPages(allLineItems.length);

  return (
    <div style={{ backgroundColor: "rgb(255, 255, 255)" }}>
      {/* Multiple pages for items */}
      {Array.from({ length: totalPages }).map((_, pageIndex) => {
        const pageItems = getItemsForPage(pageIndex, totalPages);
        const isLastPage = pageIndex === totalPages - 1;

        return (
          <div
            key={pageIndex}
            style={{
              width: "210mm",
              height: "297mm",
              backgroundColor: "rgb(255, 255, 255)",
              border: "1px solid rgb(229, 231, 235)",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              margin: "0 auto 16px auto",
              padding: "30px 48px",
              pageBreakAfter: isLastPage ? "auto" : "always",
              position: "relative",
            }}
          >
            <div className="absolute top-9 left-[72px] size-[72px]">
              <Image
                src="/logo/logo.png"
                alt="Logo"
                className="object-cover rounded-full"
                height={500}
                width={500}
              />
            </div>
            {/* Header Section */}
            <div
              style={{
                borderBottom: "2px solid rgb(31, 41, 55)",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "rgb(17, 24, 39)",
                    marginBottom: "4px",
                  }}
                >
                  CHINMOY DANISH ELECTRICAL PLUMBING SHOP
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "rgb(55, 65, 81)",
                    lineHeight: "1.25",
                    marginBottom: "8px",
                  }}
                >
                  Khagen Mahanta Road, Hengrabari
                  <br />
                  Opp. Neha Apartment, Kamrup (M)
                  <br />
                  Guwahati-781036, Assam
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "rgb(55, 65, 81)",
                  }}
                >
                  <span style={{ fontWeight: "600" }}>Phone : 63875-57792</span>
                  <span
                    style={{ fontWeight: "600" }}
                    className="text-transparent"
                  >
                    GSTIN : 18BALPD1632D1Z5
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "8px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700" }}>
                  {type === "invoices" ? "TAX INVOICE" : "PROFORMA INVOICE"}
                </h2>
              </div>
            </div>

            {/* Bill To and Invoice Details */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "16px",
                marginBottom: "12px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    padding: "4px 0",
                    marginBottom: "4px",
                  }}
                >
                  BILL TO
                </h3>
                <div
                  style={{
                    fontSize: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <p>
                    <strong>Name :</strong> {partyDetails?.name}
                  </p>
                  <p style={{ wordWrap: "break-word" }}>
                    <strong>Address :</strong> {partyDetails?.address}
                  </p>
                  {partyDetails?.gstNumber && (
                    <p>
                      <strong>GSTIN :</strong> {partyDetails?.gstNumber}
                    </p>
                  )}
                  <div className="flex gap-4">
                    <p>
                      <strong>State :</strong> {partyDetails?.state}
                    </p>
                    <p>
                      <strong>State Code :</strong> {partyDetails?.stateCode}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <table style={{ width: "100%", fontSize: "12px" }}>
                  <tbody
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <tr>
                      <td style={{ paddingRight: "8px" }}>
                        <strong>Invoice No :</strong>
                      </td>
                      <td
                        style={{ color: "rgb(220, 38, 38)", fontWeight: "500" }}
                      >
                        {billData?.billNumber}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ paddingRight: "8px" }}>
                        <strong>Invoice Date:</strong>
                      </td>
                      <td>
                        {convertToDateFormat(String(billData?.invoiceDate))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transportation Details */}
            <div style={{ marginBottom: "16px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  padding: "4px 0",
                  marginBottom: "4px",
                }}
              >
                TRANSPORTATION DETAILS
              </h3>
              <div style={{ fontSize: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span>
                    <strong>Transporter Name :</strong>{" "}
                    {billData?.supplyDetails.transporterName || ""}
                  </span>
                  <span>
                    <strong>Vehicle No :</strong>{" "}
                    {billData?.supplyDetails.vehicleNumber || (
                      <span style={{ opacity: "0" }}>AS01MA5176</span>
                    )}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>
                    <strong>Date of Supply :</strong>{" "}
                    {billData?.supplyDetails.supplyDate
                      ? convertToDateFormat(
                          String(billData?.supplyDetails.supplyDate)
                        )
                      : ""}
                  </span>
                  <span>
                    <strong>Place of Supply :</strong>{" "}
                    {billData?.supplyDetails.supplyPlace}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            {renderItemsTable(pageItems, pageIndex + 1, totalPages)}

            {/* Footer Section - Only show on last page */}
            {isLastPage && (
              <div style={{ marginTop: "24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid rgb(209, 213, 219)",
                      padding: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <p>
                      <strong>Total ₹ (in words) :</strong>
                    </p>
                    <p style={{ marginTop: "4px" }}>{amountInWords}</p>
                  </div>

                  <div>
                    <table
                      style={{
                        width: "100%",
                        fontSize: "12px",
                        borderCollapse: "collapse",
                        border: "1px solid rgb(209, 213, 219)",
                      }}
                    >
                      <tbody>
                        <tr>
                          <td
                            style={{
                              border: "1px solid rgb(209, 213, 219)",
                              padding: "4px",
                            }}
                          >
                            Taxable Amount :
                          </td>
                          <td
                            style={{
                              border: "1px solid rgb(209, 213, 219)",
                              padding: "4px",
                              textAlign: "right",
                            }}
                          >
                            ₹{formatCurrency(taxableAmount)}
                          </td>
                        </tr>
                        {isInterState ? (
                          <tr>
                            <td
                              style={{
                                border: "1px solid rgb(209, 213, 219)",
                                padding: "4px",
                              }}
                            >
                              Add IGST :
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(209, 213, 219)",
                                padding: "4px",
                                textAlign: "right",
                              }}
                            >
                              ₹{formatCurrency(gstAmount)}
                            </td>
                          </tr>
                        ) : (
                          <>
                            <tr>
                              <td
                                style={{
                                  border: "1px solid rgb(209, 213, 219)",
                                  padding: "4px",
                                }}
                              >
                                Add CGST :
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(209, 213, 219)",
                                  padding: "4px",
                                  textAlign: "right",
                                }}
                              >
                                ₹{formatCurrency(gstAmount / 2)}
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  border: "1px solid rgb(209, 213, 219)",
                                  padding: "4px",
                                }}
                              >
                                Add SGST :
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(209, 213, 219)",
                                  padding: "4px",
                                  textAlign: "right",
                                }}
                              >
                                ₹{formatCurrency(gstAmount / 2)}
                              </td>
                            </tr>
                          </>
                        )}
                        {addOnsTotal > 0 && (
                          <tr>
                            <td
                              style={{
                                border: "1px solid rgb(209, 213, 219)",
                                padding: "4px",
                              }}
                            >
                              Additional Charges :
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(209, 213, 219)",
                                padding: "4px",
                                textAlign: "right",
                              }}
                            >
                              ₹{formatCurrency(addOnsTotal)}
                            </td>
                          </tr>
                        )}
                        {/* Rounding Off Row - Only show if there's rounding difference */}
                        {Math.abs(roundingDifference) > 0.001 && (
                          <tr>
                            <td
                              style={{
                                border: "1px solid rgb(209, 213, 219)",
                                padding: "4px",
                              }}
                            >
                              Rounding Off{" "}
                              {roundingDifference > 0 ? "(+)" : "(-)"} :
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(209, 213, 219)",
                                padding: "4px",
                                textAlign: "right",
                              }}
                            >
                              ₹{formatCurrency(Math.abs(roundingDifference))}
                            </td>
                          </tr>
                        )}
                        {/* {totalDiscount > 0 && (
                          <tr>
                            <td
                              style={{
                                border: "1px solid rgb(209, 213, 219)",
                                padding: "4px",
                              }}
                            >
                              Amount Saved :
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(209, 213, 219)",
                                padding: "4px",
                                textAlign: "right",
                              }}
                              className="text-green-700"
                            >
                              ₹{formatCurrency(totalDiscount)}
                            </td>
                          </tr>
                        )} */}
                        <tr style={{ backgroundColor: "rgb(249, 250, 251)" }}>
                          <td
                            style={{
                              border: "1px solid rgb(209, 213, 219)",
                              padding: "4px",
                              fontWeight: "600",
                            }}
                          >
                            Total Amount After Tax :
                          </td>
                          <td
                            style={{
                              border: "1px solid rgb(209, 213, 219)",
                              padding: "4px",
                              textAlign: "right",
                              fontWeight: "600",
                            }}
                          >
                            ₹{formatCurrency(grandTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid rgb(209, 213, 219)",
                      padding: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <p>
                      <strong>Bank Details :</strong>
                    </p>
                    <p className="text-transparent">Punjab National Bank</p>
                    <p className="text-transparent">Zoo Road Branch</p>
                    <p className="text-transparent">
                      Account No. : 190700C100000074
                    </p>
                    <p className="text-transparent">IFSC Code : PUNB0190700</p>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgb(209, 213, 219)",
                      padding: "8px",
                      fontSize: "12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <p>
                      for{" "}
                      <span style={{ fontWeight: "600" }}>
                        Chinmoy Danish Electrical Plumbing Shop
                      </span>
                    </p>
                    <p style={{ fontSize: "10px" }}>Authorised Signatory</p>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid rgb(209, 213, 219)",
                    padding: "8px",
                    fontSize: "11px",
                  }}
                >
                  <p>
                    <strong>Declaration :</strong>
                  </p>
                  <div
                    style={{
                      marginTop: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div>
                      1. We declare that this invoice shows the actual price of
                      the goods described and that all particulars are true and
                      correct.
                    </div>
                    <div>
                      2. Goods once sold will not be taken back or exchange.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Page number */}
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                fontSize: "12px",
                color: "rgb(107, 114, 128)",
              }}
            >
              Page {pageIndex + 1} of {totalPages}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GSTBillTemplate;

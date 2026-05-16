"use client";

import React, { useMemo } from "react";
import { convertToDateFormat, convertToWords } from "../utils/helper";
import { AddOn } from "@/@types/server/response";
import Image from "next/image";

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
                    <div className="flex items-center gap-3 h-full pl-2">
                      <Image
                        src="/logo/logo.png"
                        alt=""
                        height={500}
                        width={500}
                        className="object-cover h-18 w-auto rounded-full"
                      />
                      <div className="flex flex-col">
                        <div className="company-name">
                          CHINMOY DANISH ELECTRICAL PLUMBING SHOP
                        </div>

                        <div>
                          Khagen Mahanta Road, Hengrabari, Near Kali Mandir,
                          Kamrup Metro
                        </div>

                        <div>Guwahati - 781036, Assam</div>

                        <div>GSTIN/UIN : 18AVDPT4124G1ZK</div>

                        <div>State Name : Assam, Code : 18</div>

                        <div>Contact : 60026-57792</div>
                      </div>
                    </div>
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
          width: 45%;
        }

        .hsn-col {
          width: 9%;
        }

        .qty-col {
          width: 7%;
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
          width: 13%;
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

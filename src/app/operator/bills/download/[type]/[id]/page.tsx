"use client";

import Layout from "@/components/common/layout/Layout";
import React, { useEffect, useRef, useState } from "react";
import CustomLoader from "@/components/common/CustomLoader";
import { useBillData } from "@/hooks/use-queries";
import { EnrichedBillsResponse } from "@/@types/server/response";
import { useParams } from "next/navigation";
import { Button, Loader, Text, Card, Badge, Alert } from "@mantine/core";
import dynamic from "next/dynamic";
import {
  MdOutlineFileDownload,
  MdVisibility,
  MdInfoOutline,
  MdArrowBack,
} from "react-icons/md";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

const GSTBillTemplate = dynamic(
  () => import("../../../../../../components/bills/GSTBill"),
  {
    ssr: false,
    loading: () => <CustomLoader />,
  }
);

const DownloadBill = () => {
  const billRef = useRef<HTMLDivElement>(null);
  const [isComponentLoaded, setIsComponentLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.8);
  const router = useRouter();

  const { type, id } = useParams<{
    type: "invoices" | "proforma-invoices";
    id: string;
  }>();
  const [data, setData] = useState<EnrichedBillsResponse>();

  const {
    data: billData,
    isSuccess,
    isLoading,
    isError,
  } = useBillData({
    type,
    id,
  });

  useEffect(() => {
    if (isSuccess && billData) {
      setData(billData);
    }
  }, [billData, isSuccess]);

  console.log({ billData, data });

  useEffect(() => {
    setIsComponentLoaded(true);
  }, []);

  useEffect(() => {
    if (isComponentLoaded && !isLoading && isSuccess) {
      updatePreviewScale();

      window.addEventListener("resize", updatePreviewScale);
      return () => window.removeEventListener("resize", updatePreviewScale);
    }
  }, [isComponentLoaded, isLoading, isSuccess]);

  const updatePreviewScale = () => {
    const containerWidth =
      billRef.current?.parentElement?.parentElement?.clientWidth || 800;
    const maxWidth = Math.min(containerWidth - 40, 800);
    const scale = Math.min(maxWidth / 794, 0.9);
    setPreviewScale(scale);
  };

  const generatePDF = async () => {
    if (!billRef.current || !data) return;

    setIsGenerating(true);

    try {
      // Create a container for PDF generation
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "fixed";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.top = "0";
      pdfContainer.style.width = "794px";
      pdfContainer.style.background = "white";
      pdfContainer.style.zIndex = "9999";

      // Clone and clean the bill content
      const billContent = billRef.current.cloneNode(true) as HTMLDivElement;
      billContent.style.transform = "none";
      billContent.style.width = "794px";
      billContent.style.boxShadow = "none";
      billContent.style.background = "white";

      pdfContainer.appendChild(billContent);
      document.body.appendChild(pdfContainer);

      const canvas = await html2canvas(pdfContainer, {
        useCORS: true,
        allowTaint: false,
        logging: false,
        scale: 2,
        backgroundColor: "#ffffff",
        removeContainer: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      // let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        canvas.toDataURL("image/png", 1.0),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      const pagesNeeded = Math.ceil(imgHeight / pageHeight);

      for (let i = 1; i < pagesNeeded - 1; i++) {
        position = -pageHeight * i - 4.5;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight
        );
      }

      pdf.save(
        `${type === "invoices" ? "Invoice" : "Proforma_Invoice"}_${
          data.billNumber
        }.pdf`
      );

      document.body.removeChild(pdfContainer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGoBack = () => {
    router.push(`/operator/bills/${type}`);
  };

  if (isError) {
    return (
      <Layout
        title="Download Bill"
        active={1}
        subActive={type === "invoices" ? 1 : 2}
      >
        <div className="min-h-[80vh] flex items-center justify-center">
          <Alert
            color="red"
            title="Error"
            icon={<MdInfoOutline />}
            className="max-w-md"
          >
            Failed to load bill data. Please try again.
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <>
      {isLoading && !data ? (
        <CustomLoader />
      ) : (
        <Layout
          title={`Download ${
            type === "invoices" ? "Invoice" : "Proforma Invoice"
          }`}
          active={1}
          subActive={1}
        >
          <div className="flex flex-col h-[calc(100dvh-66px)] lg:h-[92.3dvh] bg-gray-50">
            <div
              className="flex-1 overflow-y-auto"
              style={{
                display: "flex",
                flexDirection: "column",
                overflowAnchor: "none",
              }}
            >
              {/* Header Section */}
              <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="subtle"
                        leftSection={<MdArrowBack size={18} />}
                        onClick={handleGoBack}
                        className="!text-gray-600 hover:!text-gray-800 hover:!bg-gray-200"
                      >
                        Back
                      </Button>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {data?.billNumber}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge color="gray" variant="light">
                            {type === "invoices"
                              ? "INVOICE"
                              : "PROFORMA INVOICE"}
                          </Badge>
                          <Text size="sm" className="text-gray-500">
                            {data?.invoiceDate &&
                              new Date(data.invoiceDate).toLocaleDateString()}
                          </Text>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={handleGoBack}
                        className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="!bg-gradient-to-r !from-gray-700 !to-gray-600 hover:!from-gray-800 hover:!to-gray-700 !text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 !border-none h-10 !w-[165px] border border-gray-600"
                        onClick={generatePDF}
                        leftSection={
                          isGenerating ? (
                            <Loader size="sm" color="white" />
                          ) : (
                            <MdOutlineFileDownload size={18} />
                          )
                        }
                        disabled={!isComponentLoaded || isGenerating}
                        loading={isGenerating}
                      >
                        {isGenerating ? "Downloading..." : "Download PDF"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="px-6 py-6">
                <div className="max-w-7xl mx-auto">
                  {/* Info Card */}
                  <Card
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    className="mb-6 bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-200 rounded-lg mt-1">
                        <MdInfoOutline className="text-gray-600 text-lg" />
                      </div>
                      <div className="flex-1">
                        <Text size="sm" className="text-gray-700">
                          Preview of your{" "}
                          {type === "invoices" ? "invoice" : "proforma invoice"}{" "}
                          is shown below. Click &quot;Download PDF&quot; to
                          generate a high-quality printable version.
                          {!isComponentLoaded && " Loading bill template..."}
                        </Text>
                      </div>
                    </div>
                  </Card>

                  {/* Bill Preview */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Preview Container */}
                    <div className="xl:col-span-9">
                      <Card
                        shadow="md"
                        padding="lg"
                        radius="md"
                        className="bg-white border border-gray-300 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <MdVisibility className="text-gray-600" />
                            <Text className="font-semibold text-gray-800">
                              Bill Preview
                            </Text>
                          </div>
                          <Badge
                            variant="outline"
                            color="gray"
                            size="sm"
                            onClick={updatePreviewScale}
                            className="cursor-pointer"
                          >
                            Scale : {Math.round(previewScale * 100)}%
                          </Badge>
                        </div>

                        {/* Scrollable Preview Area */}
                        <div
                          className="overflow-auto bg-gray-100 rounded-lg border border-gray-300 p-4 sm:max-h-[600px] max-h-[400px] flex items-start justify-center"
                          style={{
                            backgroundImage: `
                            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                          `,
                            backgroundSize: "20px 20px",
                            backgroundPosition:
                              "0 0, 0 10px, 10px -10px, -10px 0px",
                          }}
                        >
                          {/* Single bill component used for both preview and PDF generation */}
                          <div
                            ref={billRef}
                            className="bg-white shadow-2xl transition-all duration-200 ease-in-out origin-top"
                            style={{
                              transform: `scale(${previewScale})`,
                              transformOrigin: "top center",
                              width: "794px",
                              minHeight: "1123px",
                              boxShadow:
                                "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            }}
                          >
                            {isComponentLoaded && data && (
                              <GSTBillTemplate billData={data} type={type} />
                            )}
                          </div>
                        </div>

                        {/* Scale Controls */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                          <Text className="text-gray-600 text-wrap !text-[12px]">
                            Adjust zoom to view details
                          </Text>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="xs"
                              className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
                              onClick={() =>
                                setPreviewScale((prev) =>
                                  Math.max(0.3, prev - 0.1)
                                )
                              }
                              disabled={previewScale <= 0.3}
                            >
                              -
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
                              onClick={() =>
                                setPreviewScale((prev) =>
                                  Math.min(1, prev + 0.1)
                                )
                              }
                              disabled={previewScale >= 1}
                            >
                              +
                            </Button>
                            <Button
                              variant="subtle"
                              size="xs"
                              className="!text-gray-700 hover:!bg-gray-200"
                              onClick={() => setPreviewScale(0.8)}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="xl:col-span-3">
                      <div className="space-y-4 sticky top-6">
                        {/* Bill Summary */}
                        <Card
                          shadow="sm"
                          padding="lg"
                          radius="md"
                          className="bg-white border border-gray-200"
                        >
                          <Text className="font-semibold text-gray-800 !mb-3">
                            Bill Summary
                          </Text>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Text size="sm" className="text-gray-600">
                                Bill Number :
                              </Text>
                              <Text
                                size="sm"
                                className="font-medium text-gray-700"
                              >
                                {data?.billNumber}
                              </Text>
                            </div>
                            <div className="flex justify-between">
                              <Text size="sm" className="text-gray-600">
                                Date :
                              </Text>
                              <Text
                                size="sm"
                                className="font-medium text-gray-700"
                              >
                                {data?.invoiceDate &&
                                  new Date(
                                    data.invoiceDate
                                  ).toLocaleDateString()}
                              </Text>
                            </div>
                            <div className="flex justify-between">
                              <Text size="sm" className="text-gray-600">
                                Total Amount :
                              </Text>
                              <Text
                                size="sm"
                                className="font-medium text-green-600"
                              >
                                ₹
                                {Math.round(
                                  data?.totalAmount || 0
                                )?.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Text>
                            </div>
                            {data?.partyDetails && (
                              <div className="pt-2 border-t border-gray-200 flex gap-1 items-center">
                                <Text size="sm" className="text-gray-600 mb-1">
                                  Party :
                                </Text>
                                <Text
                                  size="sm"
                                  className="font-medium text-wrap text-gray-700"
                                >
                                  {data.partyDetails.name}
                                </Text>
                              </div>
                            )}
                          </div>
                        </Card>

                        {/* Download Tips */}
                        <Card
                          shadow="sm"
                          padding="lg"
                          radius="md"
                          className="bg-white border border-gray-200"
                        >
                          <Text className="font-semibold text-gray-800 mb-3">
                            Download Tips
                          </Text>
                          <div className="space-y-2">
                            <Text size="sm" className="text-gray-600">
                              • High-quality PDF generation
                            </Text>
                            <Text size="sm" className="text-gray-600">
                              • Perfect for printing and records
                            </Text>
                            <Text size="sm" className="text-gray-600">
                              • Works on all devices
                            </Text>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      )}
    </>
  );
};

export default DownloadBill;

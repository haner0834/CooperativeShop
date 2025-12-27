import React, { useState } from "react";
import {
  Search,
  HelpCircle,
  UserCheck,
  Smartphone,
  AlertCircle,
  Info,
  Menu,
  ShoppingCart,
} from "lucide-react";
import faqData from "@shared/jsons/faq.json";
import { SidebarContent } from "../widgets/SidebarContent";
import Sidebar from "../widgets/Sidebar";

// interface FAQItem {
//   question: string;
//   answer: string;
// }

// interface FAQCategory {
//   category: string;
//   items: FAQItem[];
// }

const Navbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
        <SidebarContent />
      </Sidebar>
      <div className="navbar bg-base-100 shadow-sm z-50 fixed">
        <div className="flex-none">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="btn btn-square btn-ghost"
          >
            <Menu />
          </button>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-base font-semibold">特約商家註冊</h1>
        </div>
        <div className="flex-none"></div>
      </div>
    </>
  );
};

const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(faqData[0].category);

  // 圖示映射
  const getIcon = (category: string) => {
    switch (category) {
      case "基本介紹":
        return <Info className="w-5 h-5" />;
      case "帳號與登入":
        return <UserCheck className="w-5 h-5" />;
      case "使用方式":
        return <Smartphone className="w-5 h-5" />;
      case "服務限制與經費":
        return <AlertCircle className="w-5 h-5" />;
      case "商家簽約與目標":
        return <ShoppingCart className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8 pt-22 lg:ps-72">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">常見問題 FAQ</h1>
            <p className="text-base-content/70">
              有任何關於南校特約的使用疑問？您可以在這裡找到答案。
            </p>
          </div>
          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 z-10 flex items-center pointer-events-none">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              className="input input-bordered w-full pl-10 bg-base-100 focus:input-primary"
              placeholder="搜尋問題關鍵字..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-6">
            {/* Sidebar Tabs */}
            {!searchTerm && (
              <div className="w-full flex justify-center items-center">
                <div className="flex bg-base-100 rounded-box shadow-sm overflow-x-auto px-2 py-2 gap-2">
                  {faqData.map((cat) => (
                    <button
                      key={cat.category}
                      onClick={() => setActiveTab(cat.category)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        activeTab === cat.category
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-200"
                      }`}
                    >
                      {getIcon(cat.category)}
                      <span className="font-medium text-sm">
                        {cat.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* FAQ Content */}
            <div className="md:col-span-3 space-y-4">
              {faqData
                .filter(
                  (cat) => activeTab === cat.category || searchTerm !== ""
                )
                .map((cat) => (
                  <div key={cat.category} className={searchTerm ? "mb-8" : ""}>
                    {searchTerm && (
                      <h2 className="text-lg font-bold mb-4 px-2">
                        {cat.category}
                      </h2>
                    )}
                    <div className="space-y-3">
                      {cat.items
                        .filter(
                          (item) =>
                            item.question
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            item.answer
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                        )
                        .map((item, index) => (
                          <div
                            key={index}
                            className="collapse collapse-plus bg-base-100 shadow-sm border border-base-300"
                          >
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-md font-medium flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-primary" />
                              {item.question}
                            </div>
                            <div className="collapse-content text-sm text-base-content/80 leading-relaxed">
                              <hr className="mb-3 opacity-20" />
                              <p>{item.answer}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              {/* No Results State */}
              {searchTerm &&
                faqData.every(
                  (cat) =>
                    cat.items.filter((i) => i.question.includes(searchTerm))
                      .length === 0
                ) && (
                  <div className="text-center py-12 bg-base-100 rounded-box border border-dashed border-base-300">
                    <p className="text-base-content/50">
                      找不到與「{searchTerm}」相關的問題。
                    </p>
                  </div>
                )}
            </div>
          </div>
          {/* Footer Info */}
          <div className="mt-12 p-6 bg-base-300 rounded-2xl border border-base-300 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold">關於每日配額</h4>
              <p className="text-sm text-base-content/70 mt-1">
                為了維持系統穩定性，未繳納預備金之學校將共用免費 API
                額度。若您頻繁遇到限制，建議聯繫所屬學生會了解預備金繳納狀況。
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQPage;

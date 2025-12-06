import { type Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import { Minus, Plus, X } from "lucide-react";
import type { ContactCategory, ContactInfo } from "../../types/shop";
import { categoryMap } from "../../utils/contactInfoMap";

const allCategory: ContactCategory[] = [
  "phone-number",
  "instagram",
  "facebook",
  "line",
  "website",
  "other",
];

const ModalContent = ({
  handleAddContact,
}: {
  handleAddContact: (c: ContactCategory) => void;
}) => {
  return (
    <div className="modal-box relative space-y-4">
      <div>
        <h3 className="text-lg font-bold text-center">選擇聯絡方式</h3>
        <p className="text-center opacity-60 text-sm">
          為新的聯絡方使選擇一個類別。
        </p>
      </div>

      <form method="dialog">
        <button className="btn btn-sm btn-circle absolute top-4 right-4">
          <X className="w-4 h-4" />
        </button>

        <ul className="menu w-full border border-base-300 rounded-xl">
          {allCategory.map((category) => {
            const contact = categoryMap[category];
            return (
              <li key={category}>
                <button onClick={() => handleAddContact(category)}>
                  {contact.icon}
                  <p>{contact.name}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </form>
    </div>
  );
};

const ShopContactInfoBlock = ({
  contactInfo,
  showHint,
  setContactInfo,
}: {
  contactInfo: ContactInfo[];
  showHint: boolean;
  setContactInfo: Dispatch<React.SetStateAction<ContactInfo[]>>;
}) => {
  const addContact = (category: ContactCategory) => {
    if (contactInfo.length < 5) {
      setContactInfo([...contactInfo, { category, ...categoryMap[category] }]);
    }
  };

  const handleAddContact = (category: ContactCategory) => {
    addContact(category);
  };

  const removePhoneNumber = (index: number) => {
    if (index < 0 || index >= contactInfo.length) return;
    const newContactInfo = contactInfo.filter((_, i) => i !== index);
    setContactInfo(newContactInfo);
  };

  const updateContactContent = (index: number, newValue: string) => {
    if (index < 0 || index >= contactInfo.length) return;

    const item = contactInfo[index];
    const validatedString = item.validator(newValue);

    const newContactInfo = contactInfo.map((contact, i) => {
      if (i === index) {
        const { content, ...rest } = contact;
        return { content: validatedString, ...rest };
      }
      return contact;
    });

    setContactInfo(newContactInfo);
  };

  const openModal = () => {
    const modal = document.getElementById(
      "new_contact_modal"
    ) as HTMLDialogElement | null;
    modal?.showModal();
  };

  const isMeetRequires = (): boolean => {
    return contactInfo.filter((contact) => !!contact.content).length >= 1;
  };

  return (
    <QuestionBlock
      title="聯絡資訊"
      status={isMeetRequires() ? "ok" : "required"}
      description="至多填寫 5 個聯絡方式。"
      hint="尚未填寫聯絡資訊"
      showHint={showHint}
    >
      <dialog id="new_contact_modal" className="modal">
        <ModalContent handleAddContact={handleAddContact} />
      </dialog>

      <div className="space-y-4 transition-all duration-300">
        {contactInfo.map((contact, i) => (
          <div
            key={`CONTACT_INFO_${i}`}
            className="flex items-center space-x-2"
          >
            <div className="flex flex-col w-full">
              <label className="input w-full">
                {contact.icon}
                <p>{contact.prefix}</p>
                <input
                  type="tel"
                  value={contact.formatter(contact.content)}
                  onChange={(e) => updateContactContent(i, e.target.value)}
                  placeholder={contact.placeholder}
                  className={
                    contact.category === "phone-number" ? "tabular-nums" : ""
                  }
                />
              </label>
            </div>

            <button
              className="btn btn-xs btn-error btn-circle btn-soft"
              onClick={() => removePhoneNumber(i)}
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          className="btn btn-soft btn-primary w-full"
          popoverTarget="popover-contact-selector"
          disabled={contactInfo.length >= 5}
          onClick={openModal}
        >
          <Plus className="h-5 w-5" /> 新增聯絡方式
        </button>
      </div>
    </QuestionBlock>
  );
};

export default ShopContactInfoBlock;

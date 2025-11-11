import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import { Phone, Minus, Plus } from "lucide-react";

const ShopPhoneNumbersBlock = ({
  phoneNumbers,
  setPhoneNumbers,
}: {
  phoneNumbers: string[];
  setPhoneNumbers: Dispatch<React.SetStateAction<string[]>>;
}) => {
  const addPhoneNumber = () => {
    if (phoneNumbers.length < 5) {
      setPhoneNumbers([...phoneNumbers, ""]);
    }
  };

  const formatTaiwanPhone = (num: string) => {
    if (num.startsWith("09") && num.length === 10) {
      return num.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
    } else if (num.startsWith("0800") && num.length === 10) {
      return num.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
    } else if (/^0\d{1,2}/.test(num)) {
      return num.replace(/(\d{2,3})(\d{3,4})(\d{3,4})/, "$1-$2-$3");
    }
    return num;
  };

  const updatePhoneNumber = (index: number, newValue: string) => {
    if (index < 0 || index >= phoneNumbers.length) return;

    // 過濾非數字
    const digits = newValue.replace(/\D/g, "");

    const newPhoneNumbers = [...phoneNumbers];
    newPhoneNumbers[index] = digits;

    setPhoneNumbers(newPhoneNumbers);
  };

  const removePhoneNumber = (index: number) => {
    if (index < 0 || index >= phoneNumbers.length) return;

    const newPhoneNumbers = phoneNumbers.filter((_, i) => i !== index);

    setPhoneNumbers(newPhoneNumbers);
  };

  return (
    <QuestionBlock title="電話號碼" description="至多填寫 5 個電話號碼。">
      <div className="space-y-4 transition-all duration-300">
        {phoneNumbers.map((phoneNumber, i) => (
          <div key={`PHONE_NUM_${i}`} className="flex items-center space-x-2">
            <div className="flex flex-col w-full">
              <label className="input w-full">
                <Phone className="opacity-80" />
                <input
                  type="tel"
                  value={formatTaiwanPhone(phoneNumber)}
                  onChange={(e) => updatePhoneNumber(i, e.target.value)}
                  placeholder="0987654321"
                  className="tabular-nums"
                  minLength={9 + 3} // 9 phone num + "-" * 3
                />
              </label>
            </div>

            {phoneNumbers.length > 1 && (
              <button
                className="btn btn-xs btn-error btn-circle btn-soft"
                onClick={() => removePhoneNumber(i)}
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        <button
          className="btn btn-soft btn-primary w-full"
          disabled={phoneNumbers.length >= 5}
          onClick={addPhoneNumber}
        >
          <Plus className="h-5 w-5" /> 新增電話
        </button>
      </div>
    </QuestionBlock>
  );
};

export default ShopPhoneNumbersBlock;

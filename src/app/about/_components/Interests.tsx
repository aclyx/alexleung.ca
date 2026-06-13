import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";
import { interests } from "@/constants/interests";

export function Interests() {
  return (
    <ResponsiveContainer element="section">
      <SectionBlock title="Technical Interests" titleId="technical-focus">
        <ul className="text-body grid grid-cols-1 gap-x-4 lg:grid-cols-4">
          {interests.map((interest) => (
            <li
              key={interest}
              className="mb-3 flex items-start gap-3 leading-6"
            >
              <span
                aria-hidden="true"
                className="pt-[2px] text-xl leading-none"
              >
                •
              </span>
              <span>{interest}</span>
            </li>
          ))}
        </ul>
      </SectionBlock>
    </ResponsiveContainer>
  );
}

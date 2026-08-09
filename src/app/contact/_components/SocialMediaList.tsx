import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SocialLinkList } from "@/components/SocialLinkList";
import { Subtitle } from "@/components/Subtitle";
import { surfaceClassNames } from "@/components/Surface";

export function SocialMediaList() {
  return (
    <ResponsiveContainer element="section">
      <Subtitle title="Profiles" id="profiles" />
      <SocialLinkList
        analyticsPlacement="contact_page"
        className="mt-8 flex flex-wrap justify-center gap-4"
        itemClassName="list-none"
        linkIds={[1, 2]}
        linkClassName={surfaceClassNames({
          interactive: true,
          className: "flex items-center gap-3 px-6 py-4",
        })}
        iconClassName="text-2xl"
        labelClassName="text-body"
        rel="noopener noreferrer me"
        showLabel
        labelFormatter={(label) => label.replace(" Profile", "")}
      />
    </ResponsiveContainer>
  );
}

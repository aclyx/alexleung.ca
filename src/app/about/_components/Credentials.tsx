import { Card } from "@/components/Card";
import ExternalLink from "@/components/ExternalLink";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";

export function Credentials() {
  return (
    <ResponsiveContainer element="section">
      <SectionBlock title="Education and Licensure" titleId="credentials">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <div className="mb-4">
              <h3 className="mb-1 text-xl font-semibold">
                <ExternalLink href="https://www.peo.on.ca">
                  Professional Engineers Ontario (PEO)
                </ExternalLink>
              </h3>
              <p className="text-lg font-medium text-white">
                Professional Engineer (P.Eng.)
              </p>
              <p className="text-gray-300">Since 2017</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">
                Professional licensure in Ontario since 2017.
              </p>
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="mb-1 text-xl font-semibold">
                <ExternalLink href="https://ece.gatech.edu/">
                  Georgia Institute of Technology
                </ExternalLink>
              </h3>
              <p className="text-lg font-medium text-white">
                MSECE, Electrical &amp; Computer Engineering
              </p>
              <p className="text-gray-300">2013 - 2016</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">
                Graduate studies in computer engineering and telecommunications.
              </p>
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="mb-1 text-xl font-semibold">
                <ExternalLink href="https://uwaterloo.ca/electrical-computer-engineering/">
                  University of Waterloo
                </ExternalLink>
              </h3>
              <p className="text-lg font-medium text-white">
                BASc, Electrical Engineering &amp; Pure Mathematics
              </p>
              <p className="text-gray-300">2008 - 2013</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">
                Undergraduate training in electrical engineering and pure
                mathematics.
              </p>
            </div>
          </Card>
        </div>
      </SectionBlock>
    </ResponsiveContainer>
  );
}

import {inBrowser} from "mocha-plugin-env";
import {ClientRenderer, expect} from "test-drive-react";
import * as React from "react";

describe.assuming(inBrowser(), 'only in browser')('react root wrapper', () => {

    const clientRenderer = new ClientRenderer();
    afterEach(() => clientRenderer.cleanup());


    type Props = {
        'data-automation-id'?: string;
        'data-x'?: string;
        'data-1'?: string;
        'data-2'?: string;
    };
    class Comp extends React.Component<Props> {
        render() {
            return <div data-automation-id="Root" data-x="overriden" data-2="2"/>
        }
    }

    it("works with empty", () => {
        class Comp extends React.Component {
            render() {
                return <div data-automation-id="Root"/>
            }
        }
        const {select} = clientRenderer.render(<Comp />);

        expect(select('Root')).to.have.attribute('class', '');
    });

    it("use the root function to process props (detect by behavior)", () => {
        //@root(['data-1'])
        const {select} = clientRenderer.render(<Comp data-x="test" data-1="1" data-automation-id="custom"/>);

        expect(select('custom')).to.equal(select('Root'));
        expect(select('Root')).to.have.attribute('data-x', 'test');
        expect(select('Root')).to.not.have.attribute('data-1');
        expect(select('Root')).to.have.attribute('data-2', '2');
    });

});

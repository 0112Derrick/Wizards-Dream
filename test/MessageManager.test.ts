import MessageManager from "../src/app/MessageManager.js";
import { expect } from 'chai';


describe('messageManager.checkMessage', () => {
    it('should return the message without the bad word.', () => {
        let messageManager = new MessageManager();

        const input = "naughty word hoe";
        const expectedResult = 'naughty word ***';


        const result = messageManager.checkMessageWithoutDOM(input);
        expect(result).to.equal(expectedResult);
    });
});
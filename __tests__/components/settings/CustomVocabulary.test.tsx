/** @jest-environment jsdom */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { CustomVocabularyTextArea } from '~src/components/settings/CustomVocabulary';

// Helper creators
const buildValid = (n: number) => {
  // produce n entries like eng{i}:猫{i}
  return Array.from({ length: n }, (_, i) => `eng${i}:猫${i}`).join(';');
};

describe('CustomVocabularyTextArea', () => {
  it('counts unique English terms (splitting synonyms) and shows count', () => {
    const onChange = jest.fn();
    const onErrorHandled = jest.fn();
    const { getByRole, getByText } = render(
      <CustomVocabularyTextArea value={''} onChange={onChange} onErrorHandled={onErrorHandled} />
    );
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value: 'cat,feline:猫:ねこ;dog:犬' } });
  // Synonyms are split into separate English keys: cat, feline, dog => 3
  // Allow arbitrary whitespace/newlines between segments rendered by MUI
  getByText(/3\s*\/\s*1000\s*words/);
  });

  it('shows invalid format error when unparsable', () => {
    const onChange = jest.fn();
    const onErrorHandled = jest.fn();
    const { getByRole, getByText } = render(
      <CustomVocabularyTextArea value={''} onChange={onChange} onErrorHandled={onErrorHandled} />
    );
    const textarea = getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '::::;' } });
    getByText(/Invalid entry format/);
  });

  it('shows over-limit error when exceeding soft cap', () => {
    const onChange = jest.fn();
    const onErrorHandled = jest.fn();
    const over = buildValid(1001); // exceed 1000 unique English groups
    const { getByRole, getByText } = render(
      <CustomVocabularyTextArea value={''} onChange={onChange} onErrorHandled={onErrorHandled} />
    );
    const textarea = getByRole('textbox');
    fireEvent.change(textarea, { target: { value: over } });
    getByText(/Too many entries: 1001 \/ 1000/);
  });
});

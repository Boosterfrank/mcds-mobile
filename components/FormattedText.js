// components/FormattedText.js
import React from 'react';
import { useWindowDimensions, Linking, Alert } from 'react-native';
import RenderHTML from 'react-native-render-html';
import TableRenderer, { tableModel } from '@native-html/table-plugin';
import WebView from 'react-native-webview';

const tagsStyles = {
  body: { color: '#E5E5EA', fontSize: 15, lineHeight: 22 },
  a: { color: '#0A84FF', textDecorationLine: 'underline' },
  b: { fontWeight: '700', color: '#FFFFFF' },
  strong: { fontWeight: '700', color: '#FFFFFF' },
  i: { fontStyle: 'italic' },
  u: { textDecorationLine: 'underline' },
  span: { color: '#E5E5EA' },
  li: { marginBottom: 6, color: '#E5E5EA' },
};

const renderers = {
  table: TableRenderer,
};

const customHTMLElementModels = {
  table: tableModel,
};

const renderersProps = {
  table: {
    animationType: 'none',
    tableStyleSpecs: {
      outerBorderWidth: 1,
      rowsBorderWidth: 1,
      columnsBorderWidth: 1,
      outerBorderColor: '#3A3A3C',
      rowsBorderColor: '#3A3A3C',
      columnsBorderColor: '#3A3A3C',
      thBorderColor: '#3A3A3C',
      tdBorderColor: '#3A3A3C',
      backgroundColor: '#1C1C1E',
    },
    WebView,
  },
  a: {
    onPress: (_, href) => {
      if (!href) return;
      Linking.openURL(href).catch(() => {
        Alert.alert('Error', 'Unable to open link.');
      });
    },
  },
};

export default function FormattedText({ html }) {
  const { width } = useWindowDimensions();

  // Clean empty paragraphs or weird spacing sometimes sent by the API
  const cleanHtml = html?.replace(/<p>&nbsp;<\/p>/g, '') || '<p style="color:#8E8E93">(No content)</p>';

  const source = React.useMemo(() => ({ html: cleanHtml }), [cleanHtml]);

  return (
    <RenderHTML
      source={source}
      contentWidth={width - 40}
      tagsStyles={tagsStyles}
      renderers={renderers}
      customHTMLElementModels={customHTMLElementModels}
      renderersProps={renderersProps}
      WebView={WebView}
      enableExperimentalMarginCollapsing={true}
      baseStyle={{ color: '#E5E5EA' }}
    />
  );
}

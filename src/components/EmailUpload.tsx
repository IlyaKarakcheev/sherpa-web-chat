import React, { useRef } from 'react';
import {
  Button,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { Attach20Regular, DocumentArrowUp20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  dropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 120, 212, 0.15)',
    border: `2px dashed ${tokens.colorBrandStroke1}`,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(2px)',
    pointerEvents: 'none',
  },
  dropText: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginTop: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase300,
  },
  hiddenInput: {
    display: 'none',
  },
  attachBtn: {
    minWidth: '32px',
    width: '32px',
    height: '32px',
    padding: '0',
  },
});

interface EmailUploadProps {
  onFileUpload: (file: File) => void;
  disabled?: boolean;
}

export const EmailUpload: React.FC<EmailUploadProps> = ({
  onFileUpload,
  disabled = false,
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".msg,.eml,message/rfc822,application/vnd.ms-outlook"
        className={styles.hiddenInput}
        onChange={handleFileInputChange}
        data-testid="file-upload-input"
      />
      <Button
        appearance="subtle"
        icon={<Attach20Regular />}
        className={styles.attachBtn}
        onClick={handleAttachClick}
        disabled={disabled}
        title="Загрузить файл письма (.msg / .eml)"
        aria-label="Прикрепить файл письма (.msg / .eml)"
        data-testid="file-upload-btn"
      />
    </>
  );
};

export const DragDropZoneOverlay: React.FC<{ isDragging: boolean }> = ({ isDragging }) => {
  const styles = useStyles();
  if (!isDragging) return null;

  return (
    <div className={styles.dropOverlay} data-testid="drag-drop-overlay">
      <DocumentArrowUp20Regular style={{ fontSize: '40px', color: tokens.colorBrandForeground1 }} />
      <span className={styles.dropText}>Перетащите файл письма (.msg / .eml) сюда</span>
    </div>
  );
};

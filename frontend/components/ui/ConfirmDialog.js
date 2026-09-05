'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} isDisabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-2">
        <div className={`p-2.5 rounded-xl shrink-0 ${isDanger ? 'bg-rose-950/50 text-rose-400 border border-rose-500/30' : 'bg-amber-950/50 text-amber-400 border border-amber-500/30'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{message}</p>
      </div>
    </Modal>
  );
}

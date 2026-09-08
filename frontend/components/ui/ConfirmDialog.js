'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({
  isOpen = false,
  onClose,
  onCancel,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmText = 'Confirm',
  confirmLabel,
  cancelText = 'Cancel',
  isDanger = false,
  variant,
  isLoading = false,
}) {
  const handleClose = onClose || onCancel;
  const isDestructive = isDanger || variant === 'danger';
  const actionLabel = confirmLabel || confirmText;
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} isDisabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {actionLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-2">
        <div className={`p-2.5 rounded-xl shrink-0 ${isDestructive ? 'bg-rose-950/50 text-rose-400 border border-rose-500/30' : 'bg-amber-950/50 text-amber-400 border border-amber-500/30'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{message}</p>
      </div>
    </Modal>
  );
}

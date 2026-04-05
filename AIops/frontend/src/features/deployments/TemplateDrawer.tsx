import { useEffect } from 'react'
import { Drawer, Form, Input, Select, Button, Space } from 'antd'
import type { DeploymentTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '@/types/deployment'
import { useCreateTemplate, useUpdateTemplate } from './useDeployments'

interface Props {
  open: boolean
  editingTemplate: DeploymentTemplate | null
  onClose: () => void
}

export default function TemplateDrawer({ open, editingTemplate, onClose }: Props) {
  const [form] = Form.useForm()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()

  const isEdit = editingTemplate !== null

  useEffect(() => {
    if (open) {
      if (editingTemplate) {
        form.setFieldsValue({
          name: editingTemplate.name,
          type: editingTemplate.type,
          description: editingTemplate.description,
          script_content: editingTemplate.script_content,
        })
      } else {
        form.resetFields()
        form.setFieldValue('type', 'shell')
      }
    }
  }, [open, editingTemplate, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (isEdit) {
      await updateTemplate.mutateAsync({ id: editingTemplate!.id, data: values as UpdateTemplateRequest })
    } else {
      await createTemplate.mutateAsync(values as CreateTemplateRequest)
    }
    onClose()
  }

  const isPending = createTemplate.isPending || updateTemplate.isPending

  return (
    <Drawer
      title={isEdit ? '编辑模板' : '新建模板'}
      open={open}
      onClose={onClose}
      width={560}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={isPending} onClick={handleSubmit}>
            {isEdit ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="e.g. 应用部署脚本" />
        </Form.Item>
        <Form.Item name="type" label="类型" rules={[{ required: true }]}>
          <Select
            options={[
              { label: 'Shell 脚本', value: 'shell' },
              { label: 'Helm Chart', value: 'helm' },
              { label: 'Docker Compose', value: 'docker-compose' },
            ]}
          />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} placeholder="可选描述" />
        </Form.Item>
        <Form.Item name="script_content" label="脚本内容" rules={[{ required: true, message: '请输入脚本内容' }]}>
          <Input.TextArea
            rows={12}
            placeholder="#!/bin/bash&#10;echo 'Starting deployment...'"
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

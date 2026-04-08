import { useState, useEffect } from 'react'
import {
  Drawer, Form, Input, Select, Button, Space
} from 'antd'
import type { Model, CreateModelRequest, UpdateModelRequest, ModelProvider } from '@/types/model'
import { useCreateModel, useUpdateModel } from './useModels'

const PROVIDERS: { label: string; value: ModelProvider }[] = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: '通义千问', value: 'qwen' },
  { label: '自定义', value: 'custom' },
]

interface Props {
  open: boolean
  editingModel: Model | null
  onClose: () => void
}

export default function ModelDrawer({ open, editingModel, onClose }: Props) {
  const [form] = Form.useForm()
  const [provider, setProvider] = useState<ModelProvider>('openai')
  const createModel = useCreateModel()
  const updateModel = useUpdateModel()

  const isEdit = editingModel !== null

  useEffect(() => {
    if (open) {
      if (editingModel) {
        form.setFieldsValue({
          name: editingModel.name,
          provider: editingModel.provider,
          model_type: editingModel.model_type,
          api_endpoint: editingModel.api_endpoint,
          description: editingModel.description,
        })
        setProvider(editingModel.provider)
      } else {
        form.resetFields()
        form.setFieldsValue({ provider: 'openai', model_type: 'chat' })
        setProvider('openai')
      }
    }
  }, [open, editingModel, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()

    if (isEdit) {
      await updateModel.mutateAsync({ id: editingModel!.id, data: values as UpdateModelRequest })
    } else {
      await createModel.mutateAsync(values as CreateModelRequest)
    }
    onClose()
  }

  const isPending = createModel.isPending || updateModel.isPending

  return (
    <Drawer
      title={isEdit ? '编辑模型' : '添加模型'}
      open={open}
      onClose={onClose}
      width={480}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={isPending} onClick={handleSubmit}>
            {isEdit ? '保存' : '添加'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="e.g. 生产环境 GPT-4o" />
        </Form.Item>
        <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
          <Select
            options={PROVIDERS}
            onChange={(v) => setProvider(v)}
          />
        </Form.Item>
        <Form.Item name="model_type" label="模型类型" rules={[{ required: true }]}>
          <Select
            options={[
              { label: '对话 (Chat)', value: 'chat' },
              { label: '嵌入 (Embedding)', value: 'embedding' },
            ]}
          />
        </Form.Item>
        {(provider === 'custom' || isEdit) && (
          <Form.Item
            name="api_endpoint"
            label="API Endpoint"
            rules={provider === 'custom' ? [{ required: true, message: '自定义 Provider 需填写 Endpoint' }] : []}
          >
            <Input placeholder="https://api.example.com/v1" />
          </Form.Item>
        )}

        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="可选描述" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

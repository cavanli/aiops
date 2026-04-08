import { useState } from 'react'
import { Card, Button, Table, Tag, Space, Modal, Drawer, Form, Input, Upload, message, Spin, Empty, Typography, Alert } from 'antd'
import { UploadOutlined, FolderAddOutlined, DeleteOutlined, CopyOutlined, InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useAssets, useDeleteAsset, useUploadAsset, useLoadLocalAsset } from '../features/assets/useAssets'
import type { Asset, AssetType, AssetSource } from '../types/asset'

const { Text, Paragraph } = Typography
const { Dragger } = Upload

const assetTypeMap: Record<AssetType, string> = {
  file: '压缩包',
  directory: '目录',
}

const assetSourceMap: Record<AssetSource, string> = {
  upload: '上传',
  local: '本地目录',
}

const sourceColorMap: Record<AssetSource, string> = {
  upload: 'blue',
  local: 'orange',
}

export default function Assets() {
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)
  const [localDrawerOpen, setLocalDrawerOpen] = useState(false)
  const [localForm] = Form.useForm()

  const { data, isLoading } = useAssets()
  const deleteMutation = useDeleteAsset()
  const uploadMutation = useUploadAsset()
  const loadLocalMutation = useLoadLocalAsset()

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后资产将无法恢复，确定继续？',
      onOk: () => deleteMutation.mutate(id),
    })
  }

  const handleCopyReference = (refId: string) => {
    navigator.clipboard.writeText(`assets["${refId}"]`)
    message.success('引用语法已复制到剪贴板')
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      uploadMutation.mutate(file, {
        onSuccess: () => setUploadDrawerOpen(false),
      })
      return false
    },
  }

  const handleLoadLocal = async () => {
    const values = await localForm.validateFields()
    loadLocalMutation.mutate(values.path, {
      onSuccess: () => {
        setLocalDrawerOpen(false)
        localForm.resetFields()
      },
    })
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const columns = [
    {
      title: '资产名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: '引用 ID',
      dataIndex: 'reference_id',
      key: 'reference_id',
      width: 150,
      render: (refId: string) => (
        <Space>
          <Tag color="purple">{refId}</Tag>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyReference(refId)}
          />
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: AssetType) => assetTypeMap[type],
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: AssetSource) => (
        <Tag color={sourceColorMap[source]}>{assetSourceMap[source]}</Tag>
      ),
    },
    {
      title: '物理路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (path: string) => (
        <Text code copyable style={{ fontSize: 12 }}>
          {path}
        </Text>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => formatSize(size),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: Asset) => (
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          删除
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card
        title="部署资产管理"
        extra={
          <Space>
            <Button icon={<FolderAddOutlined />} onClick={() => setLocalDrawerOpen(true)}>
              加载本地目录
            </Button>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadDrawerOpen(true)}>
              上传资产
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          管理部署所需的静态资源、配置文件及安装包
        </div>

        {isLoading ? (
          <Spin />
        ) : !data?.items?.length ? (
          <Empty description="暂无资产" />
        ) : (
          <Table
            dataSource={data.items}
            columns={columns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      {/* Upload Drawer */}
      <Drawer
        title="上传资产"
        open={uploadDrawerOpen}
        onClose={() => setUploadDrawerOpen(false)}
        width={600}
      >
        <Alert
          message="如何引用资产？"
          description={
            <div>
              <p>您可以在工作流步骤或技能脚本中通过 <Text code>assets["引用ID"]</Text> 来引用这些资产。</p>
              <p style={{ marginTop: 8 }}>
                <Text strong>示例脚本：</Text>
              </p>
              <Paragraph code style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 4 }}>
                cp assets["ast-001"] /etc/nginx/
              </Paragraph>
              <p style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                系统会自动处理路径映射、权限设置及分发逻辑。
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Dragger {...uploadProps} style={{ marginTop: 16 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">
            支持单个文件上传，推荐上传压缩包（.tar.gz, .zip）
          </p>
        </Dragger>

        {uploadMutation.isPending && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Spin tip="上传中..." />
          </div>
        )}
      </Drawer>

      {/* Load Local Directory Drawer */}
      <Drawer
        title="加载本地目录"
        open={localDrawerOpen}
        onClose={() => setLocalDrawerOpen(false)}
        width={500}
        extra={
          <Space>
            <Button onClick={() => setLocalDrawerOpen(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleLoadLocal}
              loading={loadLocalMutation.isPending}
            >
              加载
            </Button>
          </Space>
        }
      >
        <Alert
          message="本地目录加载"
          description="指定服务器上的本地目录路径，系统将其注册为可引用资产，方便大规模资源的快速接入。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={localForm} layout="vertical">
          <Form.Item
            name="path"
            label="目录路径"
            rules={[{ required: true, message: '请输入目录路径' }]}
          >
            <Input placeholder="/var/lib/deploy/scripts" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

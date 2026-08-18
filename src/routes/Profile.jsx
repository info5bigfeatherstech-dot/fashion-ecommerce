import Account from './Account'

export default function Profile() {
  return <Account initialAuthMode="login" initialActiveTab="profile" authGateMode="page" />
}


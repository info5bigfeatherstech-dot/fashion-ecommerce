import Account from './Account'

export default function Login() {
  return <Account initialAuthMode="login" initialActiveTab="orders" authGateMode="modal" />
}


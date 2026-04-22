import { HelpCircle, Book, Video, Mail, FileText, MessageCircle } from 'lucide-react';

const UserHelp = () => {
  const faqs = [
    {
      question: 'How do I check my license expiry date?',
      answer: 'You can view your license expiry date on the main dashboard under the license information card.'
    },
    {
      question: 'What happens when my license expires?',
      answer: 'When your license expires, you will lose access to the system. Contact your administrator to renew the license.'
    },
    {
      question: 'How can I contact support?',
      answer: 'You can contact support by clicking the "Contact Support" button on your dashboard or by emailing support@example.com.'
    },
    {
      question: 'Can I use the app on multiple devices?',
      answer: 'Yes, you can login and use the app on multiple devices using the same credentials.'
    },
  ];

  const resources = [
    {
      icon: Book,
      title: 'User Guide',
      description: 'Complete guide to using the License Management System',
      link: '#'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch step-by-step video tutorials',
      link: '#'
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Technical documentation and API reference',
      link: '#'
    },
    {
      icon: MessageCircle,
      title: 'Community Forum',
      description: 'Ask questions and connect with other users',
      link: '#'
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <HelpCircle className="w-8 h-8 mr-3 text-blue-600" />
          Help & Support
        </h1>
        <p className="text-gray-600">Find answers to your questions and get assistance</p>
      </div>

      {/* Contact Support Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 mb-8 shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Need Immediate Help?</h2>
            <p className="text-gray-600 mb-4">Our support team is here to assist you</p>
            <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30">
              <Mail className="w-5 h-5 mr-2" />
              Contact Support
            </button>
          </div>
          <Mail className="w-24 h-24 text-blue-600 opacity-20" />
        </div>
      </div>

      {/* Resources Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Learning Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.link}
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                  <resource.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">{resource.title}</h3>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-5">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-blue-600 mr-2" />
                {faq.question}
              </h3>
              <p className="text-gray-600 ml-7">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Support Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 text-center">
          <Mail className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 mb-1">Email</h3>
          <p className="text-sm text-gray-600">support@example.com</p>
        </div>
        <div className="card text-center">
          <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 mb-1">Live Chat</h3>
          <p className="text-sm text-gray-600">Available 9 AM - 6 PM</p>
        </div>
        <div className="card text-center">
          <FileText className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 mb-1">Documentation</h3>
          <p className="text-sm text-gray-600">docs.example.com</p>
        </div>
      </div>
    </div>
  );
};

export default UserHelp;

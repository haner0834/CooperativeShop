//
//  SheetContent.swift
//  CooperativeShops
//
//  Created by Andy Lin on 2025/9/4.
//

import SwiftUI

struct SheetContent: View {
    let apiResponse: ApiResponse<QRData>
    
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    
    var body: some View {
        if let verifiedData = apiResponse.data {
            VStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 20)
                    .frame(width: 50, height: 3)
                    .opacity(0.15)
                    .padding(.bottom)
                    .padding(.top, 4)
                
                Row(title: "ID", value: verifiedData.userId)
                
                Row(title: "學校", value: verifiedData.schoolName)
                
                Row(title: "學校（縮寫）", value: verifiedData.schoolAbbreviation)
                
                Divider()
                
                HStack {
                    Image(systemName: "checkmark")
                    
                    Text("驗證成功")
                }
                .font(.callout)
                .fontWeight(.semibold)
                .opacity(0.7)
                .padding(4)
                .padding(.horizontal, 8)
                .background(.green.opacity(0.8))
                .clipShape(.rect(cornerRadius: 50))
            }
            .frame(maxHeight: .infinity, alignment: .top)
            .padding([.horizontal])
        }else if let error = apiResponse.error {
            VStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.yellow)
                
                Text(getErrorMessage(from: error.code))
                    .opacity(0.6)
                    .fontWeight(.medium)
            }
        }else {
            Text("未知錯誤，請按下方按鈕以通知管理者")
                .fontWeight(.medium)
                .opacity(0.5)
                .padding()
            
            HStack {
                Button(action: { dismiss() }) {
                    Text("回報")
                        .fontWeight(.bold)
                        .padding(8)
                        .padding(.horizontal)
                        .background(Color.primary.opacity(0.1))
                        .clipShape(.rect(cornerRadius: 20))
                }
                .buttonStyle(.plain)
                
                Button {
                    if let url = URL(string: "https://www.instagram.com/cooperativeshops_2026/") {
                        openURL(url)
                    }
                } label: {
                    Text("回報")
                        .fontWeight(.bold)
                        .padding(8)
                        .padding(.horizontal)
                        .background(Color.primary)
                        .foregroundStyle(Color.background)
                        .clipShape(.rect(cornerRadius: 20))
                }
                .buttonStyle(.plain)
            }
        }
    }
    
    func getErrorMessage(from code: String) -> String {
        switch code {
        case "BAD_REQUEST":
            return "請求錯誤，請稍後再試"
        case "INTERNAL_SERVER_ERROR":
            return "系統錯誤，請稍後再試"
        case "INVALID_QR":
            return "驗證不通過"
        default:
            return "Unknown Error"
        }
    }
}

struct Row: View {
    let title: String
    let value: String
    var body: some View {
        HStack {
            Text(title)
            
            Text(value)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .fontDesign(.monospaced)
    }
}

#Preview {
    ContentView()
}
